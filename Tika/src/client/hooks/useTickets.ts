'use client';

import { useCallback, useState } from 'react';
import * as ticketApi from '@/client/api/ticketApi';
import type {
  BoardData,
  CreateTicketInput,
  ReorderTicketInput,
  Ticket,
  TicketStatus,
  TicketWithMeta,
  UpdateTicketInput,
} from '@/shared/types';

const EMPTY_BOARD: BoardData['board'] = {
  BACKLOG: [],
  TODO: [],
  IN_PROGRESS: [],
  DONE: [],
};

const STATUS_LIST: TicketStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'];

function mapBoard(
  board: BoardData['board'],
  fn: (tickets: TicketWithMeta[]) => TicketWithMeta[]
): BoardData['board'] {
  return STATUS_LIST.reduce(
    (acc, status) => ({ ...acc, [status]: fn(board[status]) }),
    {} as BoardData['board']
  );
}

function sortByPosition(tickets: TicketWithMeta[]): TicketWithMeta[] {
  return [...tickets].sort((a, b) => a.position - b.position);
}

function withOverdue(ticket: Ticket): TicketWithMeta {
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = ticket.dueDate != null && ticket.status !== 'DONE' && ticket.dueDate < today;
  return { ...ticket, isOverdue };
}

function moveTicketOptimistically(
  board: BoardData['board'],
  ticketId: number,
  targetStatus: TicketStatus,
  targetPosition: number
): BoardData['board'] {
  let moved: TicketWithMeta | undefined;
  const withoutTicket = mapBoard(board, (tickets) =>
    tickets.filter((t) => {
      if (t.id === ticketId) {
        moved = t;
        return false;
      }
      return true;
    })
  );

  if (!moved) return board;

  const targetTickets = [...withoutTicket[targetStatus]];
  const insertIndex = Math.min(Math.max(targetPosition, 0), targetTickets.length);
  targetTickets.splice(insertIndex, 0, { ...moved, status: targetStatus });

  return { ...withoutTicket, [targetStatus]: targetTickets };
}

function applyReorderResult(
  board: BoardData['board'],
  ticket: Ticket,
  affected: { id: number; position: number }[]
): BoardData['board'] {
  const affectedMap = new Map(affected.map((a) => [a.id, a.position]));
  const withoutTicket = mapBoard(board, (tickets) =>
    tickets
      .filter((t) => t.id !== ticket.id)
      .map((t) => (affectedMap.has(t.id) ? { ...t, position: affectedMap.get(t.id)! } : t))
  );

  return {
    ...withoutTicket,
    [ticket.status]: sortByPosition([...withoutTicket[ticket.status], withOverdue(ticket)]),
  };
}

function applyCompleteResult(board: BoardData['board'], ticket: Ticket): BoardData['board'] {
  const withoutTicket = mapBoard(board, (tickets) => tickets.filter((t) => t.id !== ticket.id));

  return {
    ...withoutTicket,
    DONE: sortByPosition([...withoutTicket.DONE, withOverdue(ticket)]),
  };
}

export function useTickets(initialData?: BoardData['board']) {
  const [board, setBoard] = useState<BoardData['board']>(initialData ?? EMPTY_BOARD);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBoard = useCallback(async () => {
    const data = await ticketApi.getBoard();
    setBoard(data.board);
  }, []);

  const runMutation = useCallback(
    async (mutate: () => Promise<unknown>) => {
      setIsLoading(true);
      setError(null);
      try {
        await mutate();
        await refreshBoard();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    },
    [refreshBoard]
  );

  const create = useCallback(
    (input: CreateTicketInput) => runMutation(() => ticketApi.create(input)),
    [runMutation]
  );

  const update = useCallback(
    (id: number, input: UpdateTicketInput) => runMutation(() => ticketApi.update(id, input)),
    [runMutation]
  );

  const remove = useCallback((id: number) => runMutation(() => ticketApi.remove(id)), [runMutation]);

  const reorder = useCallback(async (input: ReorderTicketInput) => {
    let snapshot: BoardData['board'] = EMPTY_BOARD;
    setBoard((prev) => {
      snapshot = prev;
      return moveTicketOptimistically(prev, input.ticketId, input.status, input.position);
    });
    setError(null);
    setIsLoading(true);
    try {
      const { ticket, affected } = await ticketApi.reorder(input);
      setBoard((prev) => applyReorderResult(prev, ticket, affected));
    } catch (e) {
      setBoard(snapshot);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const complete = useCallback(async (id: number) => {
    let snapshot: BoardData['board'] = EMPTY_BOARD;
    setBoard((prev) => {
      snapshot = prev;
      return moveTicketOptimistically(prev, id, 'DONE', Number.MAX_SAFE_INTEGER);
    });
    setError(null);
    setIsLoading(true);
    try {
      const ticket = await ticketApi.complete(id);
      setBoard((prev) => applyCompleteResult(prev, ticket));
    } catch (e) {
      setBoard(snapshot);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { board, isLoading, error, create, update, remove, reorder, complete };
}
