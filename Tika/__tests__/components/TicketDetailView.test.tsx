/**
 * TicketDetailView: status, startedAt, completedAt, createdAt 읽기 전용 표시
 * TicketForm이 다루지 않는 시스템 필드(PATCH /api/tickets/:id로 수정 불가) 전용 뷰.
 */
import { render, screen } from '@testing-library/react';
import { TicketDetailView } from '@/client/components/TicketDetailView';
import type { Ticket } from '@/shared/types';

const baseTicket: Ticket = {
  id: 1,
  title: '티켓',
  description: null,
  status: 'IN_PROGRESS',
  priority: 'MEDIUM',
  position: 0,
  plannedStartDate: null,
  dueDate: null,
  startedAt: '2026-09-01T00:00:00.000Z',
  completedAt: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

describe('TicketDetailView', () => {
  test('status, startedAt, createdAt 값이 표시된다', () => {
    render(<TicketDetailView ticket={baseTicket} />);

    expect(screen.getByTestId('detail-status')).toHaveTextContent('IN_PROGRESS');
    expect(screen.getByTestId('detail-startedAt')).toHaveTextContent('2026-09-01');
    expect(screen.getByTestId('detail-createdAt')).toHaveTextContent('2026-08-01');
  });

  test('startedAt/completedAt이 null이면 "-"로 표시된다', () => {
    render(<TicketDetailView ticket={{ ...baseTicket, startedAt: null, completedAt: null }} />);

    expect(screen.getByTestId('detail-startedAt')).toHaveTextContent('-');
    expect(screen.getByTestId('detail-completedAt')).toHaveTextContent('-');
  });

  test('읽기 전용이라 입력 가능한 폼 요소가 없다', () => {
    const { container } = render(<TicketDetailView ticket={baseTicket} />);

    expect(container.querySelectorAll('input, textarea, select, button')).toHaveLength(0);
  });
});
