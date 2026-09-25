import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ColumnHeader } from '@/client/components/ColumnHeader';
import { TicketCard } from '@/client/components/TicketCard';
import type { TicketStatus, TicketWithMeta } from '@/shared/types';

interface ColumnProps {
  status: TicketStatus;
  title: string;
  tickets: TicketWithMeta[];
  onCardClick: (ticket: TicketWithMeta) => void;
}

export const Column = ({ status, title, tickets, onCardClick }: ColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col gap-3 rounded-panel border border-border bg-surface-muted p-4"
    >
      <ColumnHeader title={title} count={tickets.length} />
      <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tickets.length === 0 ? (
          <p className="text-center text-sm text-text-muted">카드가 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onClick={onCardClick} />
            ))}
          </div>
        )}
      </SortableContext>
    </div>
  );
};
