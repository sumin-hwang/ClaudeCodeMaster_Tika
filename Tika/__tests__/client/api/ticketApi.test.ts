/**
 * FE-T201: ticketApi.ts — docs/API_SPEC.md 7개 엔드포인트를 감싼 fetch 클라이언트
 * 전용 TC ID 없음(TEST_CASES.md는 useBoardData를 통한 간접 테스트를 전제) — 제안 TC-COMP-008
 */
import {
  getBoard,
  getTicket,
  createTicket,
  updateTicket,
  completeTicket,
  deleteTicket,
  reorderTicket,
} from '@/client/api/ticketApi';

const mockFetchResponse = (body: unknown, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: async () => body,
});

beforeEach(() => {
  global.fetch = jest.fn();
});

describe('ticketApi', () => {
  test('getBoard: GET /api/tickets 호출 후 응답을 그대로 반환한다', async () => {
    const board = { board: { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] }, total: 0 };
    (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(board));

    const result = await getBoard();

    expect(fetch).toHaveBeenCalledWith('/api/tickets', expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(board);
  });

  test('getTicket: GET /api/tickets/:id 호출 후 응답을 그대로 반환한다', async () => {
    const ticket = { id: 1, title: '티켓' };
    (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(ticket));

    const result = await getTicket(1);

    expect(fetch).toHaveBeenCalledWith('/api/tickets/1', expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(ticket);
  });

  test('createTicket: POST /api/tickets에 JSON body와 함께 호출된다', async () => {
    const input = { title: '새 티켓' };
    const created = { id: 1, title: '새 티켓', status: 'BACKLOG' };
    (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(created, { status: 201 }));

    const result = await createTicket(input as never);

    expect(fetch).toHaveBeenCalledWith(
      '/api/tickets',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) })
    );
    expect(result).toEqual(created);
  });

  test('updateTicket: PATCH /api/tickets/:id에 JSON body와 함께 호출된다', async () => {
    const input = { title: '수정된 제목' };
    const updated = { id: 1, title: '수정된 제목' };
    (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(updated));

    const result = await updateTicket(1, input as never);

    expect(fetch).toHaveBeenCalledWith(
      '/api/tickets/1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify(input) })
    );
    expect(result).toEqual(updated);
  });

  test('completeTicket: body 없이 PATCH /api/tickets/:id/complete를 호출한다', async () => {
    const completed = { id: 1, status: 'DONE' };
    (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(completed));

    const result = await completeTicket(1);

    expect(fetch).toHaveBeenCalledWith(
      '/api/tickets/1/complete',
      expect.objectContaining({ method: 'PATCH' })
    );
    expect((fetch as jest.Mock).mock.calls[0][1]).not.toHaveProperty('body');
    expect(result).toEqual(completed);
  });

  test('deleteTicket: DELETE /api/tickets/:id 호출 후 204면 undefined를 반환한다', async () => {
    (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(null, { status: 204 }));

    const result = await deleteTicket(1);

    expect(fetch).toHaveBeenCalledWith('/api/tickets/1', expect.objectContaining({ method: 'DELETE' }));
    expect(result).toBeUndefined();
  });

  test('reorderTicket: PATCH /api/tickets/reorder에 JSON body와 함께 호출된다', async () => {
    const input = { ticketId: 1, status: 'TODO', position: 0 };
    const response = { ticket: { id: 1, status: 'TODO', position: 0 }, affected: [] };
    (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(response));

    const result = await reorderTicket(input as never);

    expect(fetch).toHaveBeenCalledWith(
      '/api/tickets/reorder',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify(input) })
    );
    expect(result).toEqual(response);
  });

  test('에러 응답이면 {error:{code,message}}의 error 객체를 그대로 throw한다', async () => {
    const errorBody = { error: { code: 'VALIDATION_ERROR', message: '제목을 입력해주세요' } };
    (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(errorBody, { ok: false, status: 400 }));

    await expect(createTicket({ title: '' } as never)).rejects.toEqual(errorBody.error);
  });

  test('모든 요청에 Content-Type: application/json 헤더가 포함된다', async () => {
    (fetch as jest.Mock).mockResolvedValue(mockFetchResponse({}));

    await getBoard();

    const [, init] = (fetch as jest.Mock).mock.calls[0];
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });
});
