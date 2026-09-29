import { getBoard } from '@/server/services/ticketService';
import { BoardContainer } from '@/client/components/BoardContainer';
import type { BoardData, TicketPriority, TicketStatus, TicketWithMeta } from '@/shared/types';

type RawBoard = Awaited<ReturnType<typeof getBoard>>['board'];
type RawTicket = RawBoard['BACKLOG'][number];

function serializeTicket(ticket: RawTicket): TicketWithMeta {
  return {
    ...ticket,
    status: ticket.status as TicketStatus,
    priority: ticket.priority as TicketPriority,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    startedAt: ticket.startedAt ? ticket.startedAt.toISOString() : null,
    completedAt: ticket.completedAt ? ticket.completedAt.toISOString() : null,
  };
}

function serializeBoard(board: RawBoard): BoardData['board'] {
  return {
    BACKLOG: board.BACKLOG.map(serializeTicket),
    TODO: board.TODO.map(serializeTicket),
    IN_PROGRESS: board.IN_PROGRESS.map(serializeTicket),
    DONE: board.DONE.map(serializeTicket),
  };
}

export default async function Home() {
  const { board } = await getBoard();

  return <BoardContainer initialData={serializeBoard(board)} />;
}
