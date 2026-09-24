/**
 * @jest-environment node
 *
 * TC-API-003: 티켓 상세 조회 (FR-003), TC-API-004: 티켓 수정 (FR-004), TC-API-006: 티켓 삭제 (FR-006)
 * 참고: docs/API_SPEC.md "3/4/6", docs/TEST_CASES.md
 */
import { DELETE, GET, PATCH } from '../../app/api/tickets/[id]/route';
import { db, resetTickets, tickets } from '@/server/db';

const makeParams = (id: number | string) => Promise.resolve({ id: String(id) });

const patchRequest = (body: unknown) =>
  new Request('http://localhost/api/tickets/1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(async () => {
  await resetTickets();
});

describe('GET /api/tickets/:id', () => {
  test('TC-API-003-01: 존재하는 ID', async () => {
    const [created] = await db
      .insert(tickets)
      .values({ title: '상세조회', status: 'IN_PROGRESS', position: 0 })
      .returning();

    const response = await GET(new Request('http://localhost'), { params: makeParams(created.id) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(created.id);
    expect(data).toHaveProperty('isOverdue');
  });

  test('TC-API-003-02: 존재하지 않는 ID', async () => {
    const response = await GET(new Request('http://localhost'), { params: makeParams(99999) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toEqual({ code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' });
  });
});

describe('PATCH /api/tickets/:id', () => {
  test('TC-API-004-01: 부분 수정', async () => {
    const [created] = await db
      .insert(tickets)
      .values({ title: '원본', description: '설명', status: 'BACKLOG', position: 0 })
      .returning();

    const response = await PATCH(patchRequest({ title: '수정됨' }), { params: makeParams(created.id) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('수정됨');
    expect(data.description).toBe('설명');
  });

  test('TC-API-004-02: description 삭제', async () => {
    const [created] = await db
      .insert(tickets)
      .values({ title: 't', description: '설명', status: 'BACKLOG', position: 0 })
      .returning();

    const response = await PATCH(patchRequest({ description: null }), { params: makeParams(created.id) });
    const data = await response.json();

    expect(data.description).toBeNull();
  });

  test('TC-API-004-03: 일정 필드 삭제', async () => {
    const [created] = await db
      .insert(tickets)
      .values({
        title: 't',
        plannedStartDate: '2026-01-01',
        dueDate: '2026-01-02',
        status: 'BACKLOG',
        position: 0,
      })
      .returning();

    const response = await PATCH(patchRequest({ plannedStartDate: null, dueDate: null }), {
      params: makeParams(created.id),
    });
    const data = await response.json();

    expect(data.plannedStartDate).toBeNull();
    expect(data.dueDate).toBeNull();
  });

  test('TC-API-004-04: 제목 200자 초과', async () => {
    const [created] = await db.insert(tickets).values({ title: 't', status: 'BACKLOG', position: 0 }).returning();

    const response = await PATCH(patchRequest({ title: 'a'.repeat(201) }), { params: makeParams(created.id) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.message).toBe('제목은 200자 이내로 입력해주세요');
  });

  test('TC-API-004-05: 잘못된 우선순위', async () => {
    const [created] = await db.insert(tickets).values({ title: 't', status: 'BACKLOG', position: 0 }).returning();

    const response = await PATCH(patchRequest({ priority: 'URGENT' }), { params: makeParams(created.id) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.message).toBe('우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요');
  });

  test('TC-API-004-06: 과거 종료예정일', async () => {
    const [created] = await db.insert(tickets).values({ title: 't', status: 'BACKLOG', position: 0 }).returning();

    const response = await PATCH(patchRequest({ dueDate: '2000-01-01' }), { params: makeParams(created.id) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.message).toBe('종료예정일은 오늘 이후 날짜를 선택해주세요');
  });

  test('TC-API-004-07: 존재하지 않는 ID', async () => {
    const response = await PATCH(patchRequest({ title: 'x' }), { params: makeParams(99999) });
    expect(response.status).toBe(404);
  });

  test('TC-API-004-08: 수정 불가 필드 무시', async () => {
    const [created] = await db.insert(tickets).values({ title: 't', status: 'BACKLOG', position: 0 }).returning();

    const response = await PATCH(patchRequest({ status: 'DONE', position: 9999 }), {
      params: makeParams(created.id),
    });
    const data = await response.json();

    expect(data.status).toBe('BACKLOG');
    expect(data.position).toBe(0);
  });

  test('TC-API-004-09: updatedAt 갱신', async () => {
    const [created] = await db.insert(tickets).values({ title: 't', status: 'BACKLOG', position: 0 }).returning();
    await new Promise((resolve) => setTimeout(resolve, 10));

    const response = await PATCH(patchRequest({ title: '변경' }), { params: makeParams(created.id) });
    const data = await response.json();

    expect(new Date(data.updatedAt).getTime()).toBeGreaterThan(new Date(created.updatedAt).getTime());
  });
});

describe('DELETE /api/tickets/:id', () => {
  test('TC-API-006-01: 정상 삭제', async () => {
    const [created] = await db.insert(tickets).values({ title: 't', status: 'BACKLOG', position: 0 }).returning();

    const response = await DELETE(new Request('http://localhost'), { params: makeParams(created.id) });
    expect(response.status).toBe(204);

    const after = await GET(new Request('http://localhost'), { params: makeParams(created.id) });
    expect(after.status).toBe(404);
  });

  test('TC-API-006-02: 존재하지 않는 ID', async () => {
    const response = await DELETE(new Request('http://localhost'), { params: makeParams(99999) });
    expect(response.status).toBe(404);
  });
});
