/**
 * @jest-environment node
 *
 * TC-API-005: 티켓 완료 (FR-005)
 * 참고: docs/API_SPEC.md "5. PATCH /api/tickets/:id/complete", docs/TEST_CASES.md
 */
import { PATCH } from '../../app/api/tickets/[id]/complete/route';
import { db, resetTickets, tickets } from '@/server/db';

const makeParams = (id: number | string) => Promise.resolve({ id: String(id) });

beforeEach(async () => {
  await resetTickets();
});

describe('PATCH /api/tickets/:id/complete', () => {
  test('TC-API-005-01: 완료 처리', async () => {
    const [created] = await db
      .insert(tickets)
      .values({ title: 't', status: 'IN_PROGRESS', position: 0 })
      .returning();

    const response = await PATCH(new Request('http://localhost'), { params: makeParams(created.id) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('DONE');
    expect(data.completedAt).toEqual(expect.any(String));
  });

  test('TC-API-005-02: position 배치', async () => {
    await db.insert(tickets).values({ title: '기존완료', status: 'DONE', position: 0, completedAt: new Date() });
    const [created] = await db
      .insert(tickets)
      .values({ title: 't', status: 'IN_PROGRESS', position: 0 })
      .returning();

    const response = await PATCH(new Request('http://localhost'), { params: makeParams(created.id) });
    const data = await response.json();

    expect(data.position).toBe(-1024);
  });

  test('TC-API-005-03: 존재하지 않는 ID', async () => {
    const response = await PATCH(new Request('http://localhost'), { params: makeParams(99999) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toEqual({ code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' });
  });
});
