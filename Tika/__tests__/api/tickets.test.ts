/**
 * @jest-environment node
 *
 * TC-API-001: 티켓 생성 (FR-001), TC-API-002: 보드 조회 (FR-002), TC-API-008: 오버듀 판정 (FR-008)
 * 참고: docs/API_SPEC.md "1. POST /api/tickets" / "2. GET /api/tickets", docs/TEST_CASES.md
 */
import { GET, POST } from '../../app/api/tickets/route';
import { db, resetTickets, tickets } from '@/server/db';

type BoardResponse = {
  board: Record<'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE', Array<Record<string, unknown>>>;
  total: number;
};

const createRequest = (body: unknown) =>
  new Request('http://localhost/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(async () => {
  await resetTickets();
});

describe('POST /api/tickets', () => {
  test('TC-API-001-01: 필수값(title)만 입력하면 201과 함께 BACKLOG/MEDIUM/position=0으로 생성된다', async () => {
    const response = await POST(createRequest({ title: '새 티켓' }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      title: '새 티켓',
      description: null,
      status: 'BACKLOG',
      priority: 'MEDIUM',
      position: 0,
      plannedStartDate: null,
      dueDate: null,
      startedAt: null,
      completedAt: null,
    });
    expect(data.id).toEqual(expect.any(Number));
    expect(data.createdAt).toEqual(expect.any(String));
    expect(data.updatedAt).toEqual(expect.any(String));
  });

  test('TC-API-001-02: 전체 필드 입력 시 입력값이 그대로 저장·반환된다', async () => {
    // dueDate는 실행 시점 기준 항상 미래여야 하므로 고정 날짜 대신 "내일"을 동적으로 계산한다.
    // (fake timers는 postgres 드라이버의 실제 소켓/타이머와 충돌해 이후 테스트의 beforeEach를
    //  타임아웃시키므로 사용하지 않는다.)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDate = tomorrow.toISOString().split('T')[0];

    const input = {
      title: 'API 설계 문서 작성',
      description: 'REST API 엔드포인트와 요청/응답 형식을 정의한다',
      priority: 'HIGH',
      plannedStartDate: '2026-02-10',
      dueDate,
    };

    const response = await POST(createRequest(input));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      ...input,
      status: 'BACKLOG',
      startedAt: null,
      completedAt: null,
    });
  });

  test('TC-API-001-03: 제목이 없으면 400과 "제목을 입력해주세요"를 반환한다', async () => {
    const response = await POST(createRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: '제목을 입력해주세요',
    });
  });

  test('TC-API-001-04: 제목이 200자를 초과하면 400과 "제목은 200자 이내로 입력해주세요"를 반환한다', async () => {
    const response = await POST(createRequest({ title: 'a'.repeat(201) }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: '제목은 200자 이내로 입력해주세요',
    });
  });

  test('TC-API-001-05: 제목이 공백만 있으면 400과 "제목을 입력해주세요"를 반환한다', async () => {
    const response = await POST(createRequest({ title: '   ' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: '제목을 입력해주세요',
    });
  });

  test('TC-API-001-06: 설명이 1000자를 초과하면 400과 "설명은 1000자 이내로 입력해주세요"를 반환한다', async () => {
    const response = await POST(
      createRequest({ title: '제목', description: 'a'.repeat(1001) }),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: '설명은 1000자 이내로 입력해주세요',
    });
  });

  test('TC-API-001-07: 잘못된 우선순위 값이면 400과 "우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요"를 반환한다', async () => {
    const response = await POST(createRequest({ title: '제목', priority: 'URGENT' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: '우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요',
    });
  });

  test('TC-API-001-08: 종료예정일이 과거이면 400과 "종료예정일은 오늘 이후 날짜를 선택해주세요"를 반환한다', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-01T00:00:00.000Z'));

    try {
      const response = await POST(createRequest({ title: '제목', dueDate: '2026-01-31' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: '종료예정일은 오늘 이후 날짜를 선택해주세요',
      });
    } finally {
      jest.useRealTimers();
    }
  });

  test('TC-API-001-09: BACKLOG에 기존 티켓(position=0)이 있으면 신규 티켓은 position=-1024로 배치된다', async () => {
    // Given: BACKLOG에 position=0인 티켓 존재 (TC-API-001-01과 동일한 생성 결과를 선행 조건으로 사용)
    const existing = await POST(createRequest({ title: '기존 티켓' }));
    const existingData = await existing.json();
    expect(existingData.position).toBe(0);

    // When
    const response = await POST(createRequest({ title: '신규 티켓' }));
    const data = await response.json();

    // Then
    expect(response.status).toBe(201);
    expect(data.position).toBe(-1024);
  });
});

describe('GET /api/tickets', () => {
  test('TC-API-002-01: 빈 보드', async () => {
    const response = await GET();
    const data = (await response.json()) as BoardResponse;

    expect(response.status).toBe(200);
    expect(data).toEqual({
      board: { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] },
      total: 0,
    });
  });

  test('TC-API-002-02: 칼럼별 그룹화', async () => {
    await db.insert(tickets).values([
      { title: 'backlog 티켓', status: 'BACKLOG', position: 0 },
      { title: 'todo 티켓', status: 'TODO', position: 0 },
      { title: 'in progress 티켓', status: 'IN_PROGRESS', position: 0 },
      { title: 'done 티켓', status: 'DONE', position: 0, completedAt: new Date() },
    ]);

    const response = await GET();
    const data = (await response.json()) as BoardResponse;

    expect(data.board.BACKLOG).toHaveLength(1);
    expect(data.board.TODO).toHaveLength(1);
    expect(data.board.IN_PROGRESS).toHaveLength(1);
    expect(data.board.DONE).toHaveLength(1);
  });

  test('TC-API-002-03: 칼럼 내 정렬', async () => {
    await db.insert(tickets).values([
      { title: 'c', status: 'TODO', position: 2048 },
      { title: 'a', status: 'TODO', position: 0 },
      { title: 'b', status: 'TODO', position: 1024 },
    ]);

    const response = await GET();
    const data = (await response.json()) as BoardResponse;

    expect(data.board.TODO.map((t) => t.title)).toEqual(['a', 'b', 'c']);
  });

  test('TC-API-002-04: 파생 필드 포함', async () => {
    await db.insert(tickets).values({ title: '파생필드', status: 'BACKLOG', position: 0 });

    const response = await GET();
    const data = (await response.json()) as BoardResponse;

    expect(data.board.BACKLOG[0]).toHaveProperty('isOverdue');
  });

  test('TC-API-002-05: Done 24시간 필터', async () => {
    const now = Date.now();
    await db.insert(tickets).values([
      { title: '최근완료', status: 'DONE', position: 0, completedAt: new Date(now - 23 * 60 * 60 * 1000) },
      { title: '오래된완료', status: 'DONE', position: 1024, completedAt: new Date(now - 25 * 60 * 60 * 1000) },
    ]);

    const response = await GET();
    const data = (await response.json()) as BoardResponse;

    expect(data.board.DONE).toHaveLength(1);
    expect(data.board.DONE[0].title).toBe('최근완료');
  });
});

describe('GET /api/tickets — isOverdue (TC-API-008)', () => {
  test('TC-API-008-01: 기한 초과', async () => {
    await db.insert(tickets).values({ title: 't', status: 'TODO', position: 0, dueDate: '2020-01-01' });

    const response = await GET();
    const data = (await response.json()) as BoardResponse;

    expect(data.board.TODO[0].isOverdue).toBe(true);
  });

  test('TC-API-008-02: 기한 이전', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    await db.insert(tickets).values({
      title: 't',
      status: 'TODO',
      position: 0,
      dueDate: future.toISOString().split('T')[0],
    });

    const response = await GET();
    const data = (await response.json()) as BoardResponse;

    expect(data.board.TODO[0].isOverdue).toBe(false);
  });

  test('TC-API-008-03: dueDate 없음', async () => {
    await db.insert(tickets).values({ title: 't', status: 'TODO', position: 0 });

    const response = await GET();
    const data = (await response.json()) as BoardResponse;

    expect(data.board.TODO[0].isOverdue).toBe(false);
  });

  test('TC-API-008-04: 완료된 티켓', async () => {
    await db.insert(tickets).values({
      title: 't',
      status: 'DONE',
      position: 0,
      dueDate: '2020-01-01',
      completedAt: new Date(),
    });

    const response = await GET();
    const data = (await response.json()) as BoardResponse;

    expect(data.board.DONE[0].isOverdue).toBe(false);
  });

  test('TC-API-008-05: 오늘이 마감일', async () => {
    const today = new Date().toISOString().split('T')[0];
    await db.insert(tickets).values({ title: 't', status: 'TODO', position: 0, dueDate: today });

    const response = await GET();
    const data = (await response.json()) as BoardResponse;

    expect(data.board.TODO[0].isOverdue).toBe(false);
  });
});
