/**
 * ticketApi 모듈 — docs/API_SPEC.md 엔드포인트를 감싼 fetch 클라이언트
 * 함수: getBoard, create, update, remove, reorder, complete
 *
 * 각 함수마다 검증:
 * 1) 올바른 HTTP 메서드/URL로 fetch 호출 (POST/PATCH는 요청 body도 함께)
 * 2) 성공 응답을 그대로 반환
 * 3) 에러 응답(ok:false)이면 error.message를 담은 Error를 throw
 *
 * fetch는 jest.fn()으로 mock 처리.
 */
import { getBoard, create, update, remove, reorder, complete } from '@/client/api/ticketApi';

const mockFetchResponse = (body: unknown, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: async () => body,
});

const mockFetchError = (message: string, { status = 400, code = 'VALIDATION_ERROR' } = {}) =>
  mockFetchResponse({ error: { code, message } }, { ok: false, status });

beforeEach(() => {
  global.fetch = jest.fn();
});

describe('ticketApi', () => {
  describe('getBoard', () => {
    test('GET /api/tickets로 호출되고 응답을 그대로 반환한다', async () => {
      const board = { board: { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] }, total: 0 };
      (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(board));

      const result = await getBoard();

      expect(fetch).toHaveBeenCalledWith('/api/tickets', expect.objectContaining({ method: 'GET' }));
      expect(result).toEqual(board);
    });

    test('에러 응답이면 error.message를 담은 에러를 throw한다', async () => {
      (fetch as jest.Mock).mockResolvedValue(mockFetchError('서버 오류가 발생했습니다', { status: 500, code: 'INTERNAL_ERROR' }));

      await expect(getBoard()).rejects.toThrow('서버 오류가 발생했습니다');
    });
  });

  describe('create', () => {
    test('POST /api/tickets에 요청 body와 함께 호출되고 생성된 티켓을 반환한다', async () => {
      const input = { title: '새 티켓' };
      const created = { id: 1, title: '새 티켓', status: 'BACKLOG' };
      (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(created, { status: 201 }));

      const result = await create(input as never);

      expect(fetch).toHaveBeenCalledWith(
        '/api/tickets',
        expect.objectContaining({ method: 'POST', body: JSON.stringify(input) })
      );
      expect(result).toEqual(created);
    });

    test('에러 응답이면 error.message를 담은 에러를 throw한다', async () => {
      (fetch as jest.Mock).mockResolvedValue(mockFetchError('제목을 입력해주세요'));

      await expect(create({ title: '' } as never)).rejects.toThrow('제목을 입력해주세요');
    });
  });

  describe('update', () => {
    test('PATCH /api/tickets/:id에 요청 body와 함께 호출되고 수정된 티켓을 반환한다', async () => {
      const input = { title: '수정된 제목' };
      const updated = { id: 1, title: '수정된 제목' };
      (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(updated));

      const result = await update(1, input as never);

      expect(fetch).toHaveBeenCalledWith(
        '/api/tickets/1',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify(input) })
      );
      expect(result).toEqual(updated);
    });

    test('에러 응답이면 error.message를 담은 에러를 throw한다', async () => {
      (fetch as jest.Mock).mockResolvedValue(mockFetchError('티켓을 찾을 수 없습니다', { status: 404, code: 'TICKET_NOT_FOUND' }));

      await expect(update(999, { title: '제목' } as never)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });
  });

  describe('remove', () => {
    test('DELETE /api/tickets/:id로 호출되고 204면 undefined를 반환한다', async () => {
      (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(null, { status: 204 }));

      const result = await remove(1);

      expect(fetch).toHaveBeenCalledWith('/api/tickets/1', expect.objectContaining({ method: 'DELETE' }));
      expect((fetch as jest.Mock).mock.calls[0][1]).not.toHaveProperty('body');
      expect(result).toBeUndefined();
    });

    test('에러 응답이면 error.message를 담은 에러를 throw한다', async () => {
      (fetch as jest.Mock).mockResolvedValue(mockFetchError('티켓을 찾을 수 없습니다', { status: 404, code: 'TICKET_NOT_FOUND' }));

      await expect(remove(999)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });
  });

  describe('reorder', () => {
    test('PATCH /api/tickets/reorder에 요청 body와 함께 호출되고 응답을 그대로 반환한다', async () => {
      const input = { ticketId: 1, status: 'TODO', position: 0 };
      const response = { ticket: { id: 1, status: 'TODO', position: 0 }, affected: [] };
      (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(response));

      const result = await reorder(input as never);

      expect(fetch).toHaveBeenCalledWith(
        '/api/tickets/reorder',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify(input) })
      );
      expect(result).toEqual(response);
    });

    test('에러 응답이면 error.message를 담은 에러를 throw한다', async () => {
      (fetch as jest.Mock).mockResolvedValue(mockFetchError('상태는 BACKLOG, TODO, IN_PROGRESS 중 선택해주세요'));

      await expect(reorder({ ticketId: 1, status: 'DONE', position: 0 } as never)).rejects.toThrow(
        '상태는 BACKLOG, TODO, IN_PROGRESS 중 선택해주세요'
      );
    });
  });

  describe('complete', () => {
    test('body 없이 PATCH /api/tickets/:id/complete로 호출되고 완료된 티켓을 반환한다', async () => {
      const completed = { id: 1, status: 'DONE' };
      (fetch as jest.Mock).mockResolvedValue(mockFetchResponse(completed));

      const result = await complete(1);

      expect(fetch).toHaveBeenCalledWith(
        '/api/tickets/1/complete',
        expect.objectContaining({ method: 'PATCH' })
      );
      expect((fetch as jest.Mock).mock.calls[0][1]).not.toHaveProperty('body');
      expect(result).toEqual(completed);
    });

    test('에러 응답이면 error.message를 담은 에러를 throw한다', async () => {
      (fetch as jest.Mock).mockResolvedValue(mockFetchError('티켓을 찾을 수 없습니다', { status: 404, code: 'TICKET_NOT_FOUND' }));

      await expect(complete(999)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });
  });
});
