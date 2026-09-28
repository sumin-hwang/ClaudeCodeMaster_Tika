import type { Ticket } from '@/shared/types';

interface TicketDetailViewProps {
  ticket: Ticket;
}

const formatDate = (value: string | null) => (value ? value.slice(0, 10) : '-');

export const TicketDetailView = ({ ticket }: TicketDetailViewProps) => {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-muted">
      <dt>상태</dt>
      <dd data-testid="detail-status">{ticket.status}</dd>
      <dt>시작일</dt>
      <dd data-testid="detail-startedAt">{formatDate(ticket.startedAt)}</dd>
      <dt>완료일</dt>
      <dd data-testid="detail-completedAt">{formatDate(ticket.completedAt)}</dd>
      <dt>생성일</dt>
      <dd data-testid="detail-createdAt">{formatDate(ticket.createdAt)}</dd>
    </dl>
  );
};
