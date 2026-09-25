interface DueDateBadgeProps {
  dueDate: string;
  isOverdue?: boolean;
}

export const DueDateBadge = ({ dueDate, isOverdue = false }: DueDateBadgeProps) => {
  const colorClass = isOverdue ? 'bg-overdue-bg text-overdue-text' : 'text-text-muted';

  return (
    <span className={`rounded-card px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {dueDate}
    </span>
  );
};
