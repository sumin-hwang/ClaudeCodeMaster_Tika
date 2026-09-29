/**
 * useTickets: ticketApi를 감싸서 board 상태 관리 + CRUD 제공
 * 반환: { board, isLoading, error, create, update, remove, reorder, complete }
 *
 * ticketApi는 jest.mock으로 처리, renderHook + act() 사용.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { useTickets } from '@/client/hooks/useTickets';
import * as ticketApi from '@/client/api/ticketApi';
import type { BoardData, TicketWithMeta } from '@/shared/types';

jest.mock('@/client/api/ticketApi');

const mockedTicketApi = ticketApi as jest.Mocked<typeof ticketApi>;

const EMPTY_BOARD: BoardData['board'] = { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] };

const makeTicket = (overrides: Partial<TicketWithMeta> = {}): TicketWithMeta => ({
  id: 1,
  title: '티켓',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  position: 0,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  isOverdue: false,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useTickets', () => {
  test('initialData가 있으면 board가 그 값으로 초기화된다', () => {
    const initialData = { ...EMPTY_BOARD, TODO: [makeTicket({ id: 1 })] };
    const { result } = renderHook(() => useTickets(initialData));

    expect(result.current.board).toEqual(initialData);
  });

  test('initialData가 없으면 board가 빈 4개 컬럼으로 초기화된다', () => {
    const { result } = renderHook(() => useTickets());

    expect(result.current.board).toEqual(EMPTY_BOARD);
  });

  test('create 호출 시 ticketApi.create 후 보드를 새로고침한다', async () => {
    const newBoard = { ...EMPTY_BOARD, BACKLOG: [makeTicket({ id: 2 })] };
    mockedTicketApi.create.mockResolvedValue(makeTicket({ id: 2 }));
    mockedTicketApi.getBoard.mockResolvedValue({ board: newBoard, total: 1 });

    const { result } = renderHook(() => useTickets());

    await act(async () => {
      await result.current.create({ title: '새 티켓' } as never);
    });

    expect(mockedTicketApi.create).toHaveBeenCalledWith({ title: '새 티켓' });
    expect(mockedTicketApi.getBoard).toHaveBeenCalled();
    expect(result.current.board).toEqual(newBoard);
  });

  test('update 호출 시 ticketApi.update 후 보드를 새로고침한다', async () => {
    const newBoard = { ...EMPTY_BOARD, TODO: [makeTicket({ id: 1, title: '수정됨' })] };
    mockedTicketApi.update.mockResolvedValue(makeTicket({ id: 1 }));
    mockedTicketApi.getBoard.mockResolvedValue({ board: newBoard, total: 1 });

    const { result } = renderHook(() => useTickets());

    await act(async () => {
      await result.current.update(1, { title: '수정됨' } as never);
    });

    expect(mockedTicketApi.update).toHaveBeenCalledWith(1, { title: '수정됨' });
    expect(mockedTicketApi.getBoard).toHaveBeenCalled();
    expect(result.current.board).toEqual(newBoard);
  });

  test('remove 호출 시 ticketApi.remove 후 보드를 새로고침한다', async () => {
    mockedTicketApi.remove.mockResolvedValue(undefined);
    mockedTicketApi.getBoard.mockResolvedValue({ board: EMPTY_BOARD, total: 0 });

    const { result } = renderHook(() => useTickets());

    await act(async () => {
      await result.current.remove(1);
    });

    expect(mockedTicketApi.remove).toHaveBeenCalledWith(1);
    expect(mockedTicketApi.getBoard).toHaveBeenCalled();
  });

  test('reorder 호출 시 board가 즉시 낙관적으로 갱신되고, 성공 시 서버 응답으로 재동기화된다', async () => {
    let resolveReorder: (value: { ticket: TicketWithMeta; affected: { id: number; position: number }[] }) => void =
      () => {};
    mockedTicketApi.reorder.mockReturnValue(
      new Promise((resolve) => {
        resolveReorder = resolve;
      })
    );

    const initialData = {
      ...EMPTY_BOARD,
      TODO: [makeTicket({ id: 1 })],
      IN_PROGRESS: [makeTicket({ id: 2 })],
    };
    const { result } = renderHook(() => useTickets(initialData));

    act(() => {
      result.current.reorder({ ticketId: 1, status: 'IN_PROGRESS', position: 1 } as never);
    });

    await waitFor(() => {
      expect(result.current.board.TODO).toHaveLength(0);
      expect(result.current.board.IN_PROGRESS.map((t) => t.id)).toEqual([2, 1]);
    });
    expect(mockedTicketApi.getBoard).not.toHaveBeenCalled();

    await act(async () => {
      resolveReorder({
        ticket: makeTicket({ id: 1, status: 'IN_PROGRESS', position: 2048 }),
        affected: [{ id: 2, position: 1024 }],
      });
    });

    expect(result.current.board.IN_PROGRESS.map((t) => t.id)).toEqual([2, 1]);
    expect(result.current.board.IN_PROGRESS.find((t) => t.id === 2)?.position).toBe(1024);
    expect(result.current.board.IN_PROGRESS.find((t) => t.id === 1)?.position).toBe(2048);
    expect(mockedTicketApi.getBoard).not.toHaveBeenCalled();
  });

  test('complete 호출 시 board가 즉시 DONE으로 낙관적 이동하고, 성공 시 서버 응답으로 재동기화된다', async () => {
    let resolveComplete: (value: TicketWithMeta) => void = () => {};
    mockedTicketApi.complete.mockReturnValue(
      new Promise((resolve) => {
        resolveComplete = resolve;
      })
    );

    const initialData = { ...EMPTY_BOARD, TODO: [makeTicket({ id: 1 })] };
    const { result } = renderHook(() => useTickets(initialData));

    act(() => {
      result.current.complete(1);
    });

    await waitFor(() => {
      expect(result.current.board.TODO).toHaveLength(0);
      expect(result.current.board.DONE.map((t) => t.id)).toEqual([1]);
    });
    expect(mockedTicketApi.getBoard).not.toHaveBeenCalled();

    await act(async () => {
      resolveComplete(
        makeTicket({ id: 1, status: 'DONE', completedAt: '2026-09-29T00:00:00.000Z' })
      );
    });

    expect(result.current.board.DONE[0]).toMatchObject({ id: 1, status: 'DONE' });
    expect(mockedTicketApi.getBoard).not.toHaveBeenCalled();
  });

  test('reorder 실패 시 board가 호출 전 상태로 롤백되고 error가 설정된다', async () => {
    mockedTicketApi.reorder.mockRejectedValue(new Error('재정렬에 실패했습니다'));

    const initialData = { ...EMPTY_BOARD, TODO: [makeTicket({ id: 1 })] };
    const { result } = renderHook(() => useTickets(initialData));

    await act(async () => {
      await result.current.reorder({ ticketId: 1, status: 'IN_PROGRESS', position: 0 } as never);
    });

    expect(result.current.board).toEqual(initialData);
    expect(result.current.error).toBe('재정렬에 실패했습니다');
  });

  test('complete 실패 시 board가 호출 전 상태로 롤백되고 error가 설정된다', async () => {
    mockedTicketApi.complete.mockRejectedValue(new Error('완료 처리에 실패했습니다'));

    const initialData = { ...EMPTY_BOARD, TODO: [makeTicket({ id: 1 })] };
    const { result } = renderHook(() => useTickets(initialData));

    await act(async () => {
      await result.current.complete(1);
    });

    expect(result.current.board).toEqual(initialData);
    expect(result.current.error).toBe('완료 처리에 실패했습니다');
  });

  test('ticketApi 호출이 실패하면 error 상태가 설정되고 보드는 갱신되지 않는다', async () => {
    mockedTicketApi.create.mockRejectedValue(new Error('제목을 입력해주세요'));

    const { result } = renderHook(() => useTickets());

    await act(async () => {
      await result.current.create({ title: '' } as never);
    });

    expect(result.current.error).toBe('제목을 입력해주세요');
    expect(mockedTicketApi.getBoard).not.toHaveBeenCalled();
  });

  test('API 호출 중에는 isLoading이 true였다가 완료 후 false로 돌아온다', async () => {
    let resolveCreate: (ticket: TicketWithMeta) => void = () => {};
    mockedTicketApi.create.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      })
    );
    mockedTicketApi.getBoard.mockResolvedValue({ board: EMPTY_BOARD, total: 0 });

    const { result } = renderHook(() => useTickets());

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.create({ title: '새 티켓' } as never);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolveCreate(makeTicket());
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  test('이전 호출의 error는 다음 호출이 성공하면 초기화된다', async () => {
    mockedTicketApi.create.mockRejectedValueOnce(new Error('실패'));
    mockedTicketApi.getBoard.mockResolvedValue({ board: EMPTY_BOARD, total: 0 });

    const { result } = renderHook(() => useTickets());

    await act(async () => {
      await result.current.create({ title: '' } as never);
    });
    expect(result.current.error).toBe('실패');

    mockedTicketApi.create.mockResolvedValueOnce(makeTicket());

    await act(async () => {
      await result.current.create({ title: '재시도' } as never);
    });

    expect(result.current.error).toBeNull();
  });
});
