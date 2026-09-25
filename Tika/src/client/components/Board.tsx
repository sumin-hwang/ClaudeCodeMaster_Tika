import { Column } from '@/client/components/Column';
import type { BoardData, TicketStatus, TicketWithMeta } from '@/shared/types';

interface BoardProps {
  board: BoardData['board'];
  onCardClick: (ticket: TicketWithMeta) => void;
}

const COLUMN_LABEL: Record<Exclude<TicketStatus, 'BACKLOG'>, string> = {
  TODO: 'TODO',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export const Board = ({ board, onCardClick }: BoardProps) => {
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <aside data-testid="backlog-sidebar" className="lg:w-[var(--sidebar-width)] lg:shrink-0">
        <Column status="BACKLOG" title="Backlog" tickets={board.BACKLOG} onCardClick={onCardClick} />
      </aside>
      <div data-testid="board-main" className="grid flex-1 gap-4 lg:grid-cols-3">
        {(Object.keys(COLUMN_LABEL) as Exclude<TicketStatus, 'BACKLOG'>[]).map((status) => (
          <Column
            key={status}
            status={status}
            title={COLUMN_LABEL[status]}
            tickets={board[status]}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
};
