/**
 * @jest-environment node
 *
 * TC-API-007: 상태/순서 변경 - 드래그앤드롭 (FR-007)
 * 참고: docs/API_SPEC.md "7. PATCH /api/tickets/reorder", docs/TEST_CASES.md
 *
 * TC-API-007-11(트랜잭션 원자성, DB 오류 mock 필요)은 현재 아키텍처에서
 * db.transaction 내부 실패를 주입할 수단이 없어 이 통합 테스트 스위트에서는 다루지 않는다.
 */
import { PATCH } from '../../app/api/tickets/reorder/route';
import { db, resetTickets, tickets } from '@/server/db';

const reorderRequest = (body: unknown) =>
  new Request('http://localhost/api/tickets/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(async () => {
  await resetTickets();
});

describe('PATCH /api/tickets/reorder', () => {
  test('TC-API-007-01: 카드 사이 삽입', async () => {
    await db.insert(tickets).values({ title: 'a', status: 'TODO', position: 0 });
    await db.insert(tickets).values({ title: 'b', status: 'TODO', position: 1024 });
    const [moving] = await db.insert(tickets).values({ title: 'moving', status: 'BACKLOG', position: 0 }).returning();

    const response = await PATCH(reorderRequest({ ticketId: moving.id, status: 'TODO', position: 1 }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ticket.position).toBe(512);
  });

  test('TC-API-007-02: 맨 앞 삽입', async () => {
    await db.insert(tickets).values({ title: 'a', status: 'TODO', position: 0 });
    const [moving] = await db.insert(tickets).values({ title: 'moving', status: 'BACKLOG', position: 0 }).returning();

    const response = await PATCH(reorderRequest({ ticketId: moving.id, status: 'TODO', position: 0 }));
    const data = await response.json();

    expect(data.ticket.position).toBe(-1024);
  });

  test('TC-API-007-03: 맨 뒤 삽입', async () => {
    await db.insert(tickets).values({ title: 'a', status: 'TODO', position: 1024 });
    const [moving] = await db.insert(tickets).values({ title: 'moving', status: 'BACKLOG', position: 0 }).returning();

    const response = await PATCH(reorderRequest({ ticketId: moving.id, status: 'TODO', position: 1 }));
    const data = await response.json();

    expect(data.ticket.position).toBe(2048);
  });

  test('TC-API-007-04: 간격 부족 시 재정렬', async () => {
    // position 중복(0, 0)으로 인접 간격 0(<1)인 상태를 재현
    await db.insert(tickets).values({ title: 'a', status: 'TODO', position: 0 });
    await db.insert(tickets).values({ title: 'b', status: 'TODO', position: 0 });
    const [moving] = await db.insert(tickets).values({ title: 'moving', status: 'BACKLOG', position: 0 }).returning();

    const response = await PATCH(reorderRequest({ ticketId: moving.id, status: 'TODO', position: 1 }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.affected.length).toBeGreaterThan(0);

    const positions = [data.ticket.position, ...data.affected.map((a: { position: number }) => a.position)];
    expect(new Set(positions).size).toBe(positions.length);
  });

  test('TC-API-007-05: TODO 이동 시 시작일 기록', async () => {
    const [t] = await db.insert(tickets).values({ title: 't', status: 'BACKLOG', position: 0 }).returning();

    const response = await PATCH(reorderRequest({ ticketId: t.id, status: 'TODO', position: 0 }));
    const data = await response.json();

    expect(data.ticket.startedAt).toEqual(expect.any(String));
  });

  test('TC-API-007-06: TODO→BACKLOG 시작일 초기화', async () => {
    const [t] = await db
      .insert(tickets)
      .values({ title: 't', status: 'TODO', position: 0, startedAt: new Date() })
      .returning();

    const response = await PATCH(reorderRequest({ ticketId: t.id, status: 'BACKLOG', position: 0 }));
    const data = await response.json();

    expect(data.ticket.startedAt).toBeNull();
  });

  test('TC-API-007-07: DONE 이탈 시 완료일 초기화', async () => {
    const [t] = await db
      .insert(tickets)
      .values({ title: 't', status: 'DONE', position: 0, completedAt: new Date() })
      .returning();

    const response = await PATCH(reorderRequest({ ticketId: t.id, status: 'IN_PROGRESS', position: 0 }));
    const data = await response.json();

    expect(data.ticket.completedAt).toBeNull();
  });

  test('TC-API-007-08: DONE 지정 거부', async () => {
    const [t] = await db.insert(tickets).values({ title: 't', status: 'TODO', position: 0 }).returning();

    const response = await PATCH(reorderRequest({ ticketId: t.id, status: 'DONE', position: 0 }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.message).toBe('상태는 BACKLOG, TODO, IN_PROGRESS 중 선택해주세요');
  });

  test('TC-API-007-09: 존재하지 않는 ticketId', async () => {
    const response = await PATCH(reorderRequest({ ticketId: 99999, status: 'TODO', position: 0 }));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toEqual({ code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' });
  });

  test('TC-API-007-10: affected 응답', async () => {
    await db.insert(tickets).values({ title: 'a', status: 'TODO', position: 0 });
    await db.insert(tickets).values({ title: 'b', status: 'TODO', position: 0 });
    const [moving] = await db.insert(tickets).values({ title: 'moving', status: 'BACKLOG', position: 0 }).returning();

    const response = await PATCH(reorderRequest({ ticketId: moving.id, status: 'TODO', position: 1 }));
    const data = await response.json();

    expect(Array.isArray(data.affected)).toBe(true);
    data.affected.forEach((a: { id: number; position: number }) => {
      expect(typeof a.id).toBe('number');
      expect(typeof a.position).toBe('number');
    });
  });
});
