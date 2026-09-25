import type { TicketPriority } from '@/shared/types';

interface PriorityBadgeProps {
  priority: TicketPriority;
}

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
};

const PRIORITY_CLASS: Record<TicketPriority, string> = {
  LOW: 'bg-priority-low-bg text-priority-low-text',
  MEDIUM: 'bg-priority-medium-bg text-priority-medium-text',
  HIGH: 'bg-priority-high-bg text-priority-high-text',
};

export const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  return (
    <span className={`rounded-card px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASS[priority]}`}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
};
