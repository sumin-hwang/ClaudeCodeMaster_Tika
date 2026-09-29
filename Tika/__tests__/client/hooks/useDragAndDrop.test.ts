/**
 * FE-T504: useDragAndDrop — dnd-kit 설정 + onDragEnd에서 드롭 대상 status/position을 계산해
 * useTickets의 reorder/complete를 호출한다 (targetStatus==='DONE'이면 complete, 아니면 reorder).
 */
import { renderHook } from '@testing-library/react';
import { useDragAndDrop } from '@/client/hooks/useDragAndDrop';
import type { BoardData, TicketWithMeta } from '@/shared/types';
import type { DragEndEvent } from '@dnd-kit/core';

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

const EMPTY_BOARD: BoardData['board'] = { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] };

const makeEvent = (
  activeId: number,
  over: { id: string | number; status?: string } | null
): DragEndEvent =>
  ({
    active: { id: activeId, data: { current: undefined }, rect: {} },
    over: over
      ? { id: over.id, data: { current: over.status ? { status: over.status } : undefined }, rect: {} }
      : null,
  }) as unknown as DragEndEvent;

describe('useDragAndDrop', () => {
  test('다른 컬럼의 빈 영역에 드롭하면 reorder가 해당 컬럼 맨 뒤 위치로 호출된다', () => {
    const board = {
      ...EMPTY_BOARD,
      TODO: [makeTicket({ id: 1, status: 'TODO' })],
      IN_PROGRESS: [makeTicket({ id: 2, status: 'IN_PROGRESS' }), makeTicket({ id: 3, status: 'IN_PROGRESS' })],
    };
    const reorder = jest.fn();
    const complete = jest.fn();
    const { result } = renderHook(() => useDragAndDrop({ board, reorder, complete }));

    result.current.onDragEnd(makeEvent(1, { id: 'IN_PROGRESS', status: 'IN_PROGRESS' }));

    expect(reorder).toHaveBeenCalledWith({ ticketId: 1, status: 'IN_PROGRESS', position: 2 });
    expect(complete).not.toHaveBeenCalled();
  });

  test('다른 컬럼의 특정 카드 위에 드롭하면 해당 카드 인덱스로 reorder가 호출된다', () => {
    const board = {
      ...EMPTY_BOARD,
      TODO: [makeTicket({ id: 1, status: 'TODO' })],
      IN_PROGRESS: [makeTicket({ id: 2, status: 'IN_PROGRESS' }), makeTicket({ id: 3, status: 'IN_PROGRESS' })],
    };
    const reorder = jest.fn();
    const complete = jest.fn();
    const { result } = renderHook(() => useDragAndDrop({ board, reorder, complete }));

    result.current.onDragEnd(makeEvent(1, { id: 3, status: 'IN_PROGRESS' }));

    expect(reorder).toHaveBeenCalledWith({ ticketId: 1, status: 'IN_PROGRESS', position: 1 });
  });

  test('같은 컬럼 내 다른 카드 위로 드롭하면(재정렬) 같은 status로 reorder가 호출된다', () => {
    const board = {
      ...EMPTY_BOARD,
      TODO: [makeTicket({ id: 1, status: 'TODO' }), makeTicket({ id: 2, status: 'TODO' }), makeTicket({ id: 3, status: 'TODO' })],
    };
    const reorder = jest.fn();
    const complete = jest.fn();
    const { result } = renderHook(() => useDragAndDrop({ board, reorder, complete }));

    result.current.onDragEnd(makeEvent(1, { id: 3, status: 'TODO' }));

    expect(reorder).toHaveBeenCalledWith({ ticketId: 1, status: 'TODO', position: 1 });
  });

  test('DONE 컬럼/카드로 드롭하면 complete가 호출되고 reorder는 호출되지 않는다', () => {
    const board = {
      ...EMPTY_BOARD,
      TODO: [makeTicket({ id: 1, status: 'TODO' })],
      DONE: [makeTicket({ id: 4, status: 'DONE' })],
    };
    const reorder = jest.fn();
    const complete = jest.fn();
    const { result } = renderHook(() => useDragAndDrop({ board, reorder, complete }));

    result.current.onDragEnd(makeEvent(1, { id: 'DONE', status: 'DONE' }));

    expect(complete).toHaveBeenCalledWith(1);
    expect(reorder).not.toHaveBeenCalled();
  });

  test('over가 없으면(보드 밖 드롭) reorder/complete 모두 호출되지 않는다', () => {
    const board = { ...EMPTY_BOARD, TODO: [makeTicket({ id: 1, status: 'TODO' })] };
    const reorder = jest.fn();
    const complete = jest.fn();
    const { result } = renderHook(() => useDragAndDrop({ board, reorder, complete }));

    result.current.onDragEnd(makeEvent(1, null));

    expect(reorder).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });

  test('sensors 배열에 Pointer/Touch/Keyboard 센서가 등록된다', () => {
    const board = EMPTY_BOARD;
    const { result } = renderHook(() => useDragAndDrop({ board, reorder: jest.fn(), complete: jest.fn() }));

    expect(result.current.sensors).toHaveLength(3);
  });
});
