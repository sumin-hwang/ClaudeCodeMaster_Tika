import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PriorityBadge, DueDateBadge } from '@/client/components/Badge';
import type { TicketWithMeta } from '@/shared/types';

interface TicketCardProps {
  ticket: TicketWithMeta;
  onClick: (ticket: TicketWithMeta) => void;
}

export const TicketCard = ({ ticket, onClick }: TicketCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // listeners의 onKeyDown(방향키 드래그, KeyboardSensor)은 useDragAndDrop 연동 시(Phase 6) 합성 예정
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(ticket);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`${ticket.title}, 우선순위 ${ticket.priority}${ticket.isOverdue ? ', 기한 초과' : ''}`}
      data-overdue={ticket.isOverdue}
      className={`ticket-card${ticket.status === 'DONE' ? ' ticket-card--done' : ''}`}
      onClick={() => onClick(ticket)}
      onKeyDown={handleKeyDown}
    >
      <h3 className="truncate text-sm font-medium text-text">{ticket.title}</h3>
      <div className="flex items-center gap-2">
        <PriorityBadge priority={ticket.priority} />
        {ticket.dueDate && (
          <div data-testid="ticket-due-date">
            <DueDateBadge dueDate={ticket.dueDate} isOverdue={ticket.isOverdue} />
          </div>
        )}
      </div>
    </div>
  );
};
