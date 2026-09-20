/**
 * @jest-environment node
 *
 * TC-API-001: 티켓 생성 (FR-001)
 * 참고: docs/API_SPEC.md "1. POST /api/tickets", docs/TEST_CASES.md "TC-API-001"
 *
 * 아직 app/api/tickets/route.ts가 구현되지 않았으므로 이 테스트는 전부 실패한다 (RED).
 */
import { POST } from '../../app/api/tickets/route';
import { resetTickets } from '@/server/db';

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
    const input = {
      title: 'API 설계 문서 작성',
      description: 'REST API 엔드포인트와 요청/응답 형식을 정의한다',
      priority: 'HIGH',
      plannedStartDate: '2026-02-10',
      dueDate: '2026-09-20',
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
