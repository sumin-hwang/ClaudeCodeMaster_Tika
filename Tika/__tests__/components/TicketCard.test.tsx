/**
 * TC-COMP-001: TicketCard 렌더링/상태 표시
 * 참고: docs/TEST_CASES.md TC-COMP-001, docs/COMPONENT_SPEC.md 4.1
 *
 * @dnd-kit/sortable의 useSortable은 DndContext 없이는 정상 동작하지 않으므로
 * 단위 테스트에서는 inert한 값을 반환하도록 mock 처리한다.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketCard } from '@/client/components/TicketCard';
import type { TicketWithMeta } from '@/shared/types';

jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

const baseTicket: TicketWithMeta = {
  id: 1,
  title: '테스트 티켓',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  position: 0,
  plannedStartDate: null,
  dueDate: '2026-10-01',
  startedAt: null,
  completedAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  isOverdue: false,
};

const makeTicket = (overrides: Partial<TicketWithMeta> = {}): TicketWithMeta => ({
  ...baseTicket,
  ...overrides,
});

describe('TicketCard', () => {
  test('C001-1: 기본 렌더링 — 제목, 우선순위 뱃지, 종료예정일이 표시된다', () => {
    const ticket = makeTicket({ title: '문서 작성하기', priority: 'MEDIUM', dueDate: '2026-10-01' });
    render(<TicketCard ticket={ticket} onClick={jest.fn()} />);

    expect(screen.getByText('문서 작성하기')).toBeInTheDocument();
    expect(screen.getByText('보통')).toBeInTheDocument();
    expect(screen.getByText('2026-10-01')).toBeInTheDocument();
  });

  test('C001-2: 오버듀 표시 — isOverdue=true면 카드 루트에 data-overdue 속성이 붙는다', () => {
    const ticket = makeTicket({ isOverdue: true });
    render(<TicketCard ticket={ticket} onClick={jest.fn()} />);

    expect(screen.getByRole('button')).toHaveAttribute('data-overdue', 'true');
  });

  test('C001-3: 완료 상태 — status="DONE"이면 ticket-card--done 클래스가 적용된다', () => {
    const ticket = makeTicket({ status: 'DONE' });
    render(<TicketCard ticket={ticket} onClick={jest.fn()} />);

    expect(screen.getByRole('button')).toHaveClass('ticket-card--done');
  });

  test('C001-4: dueDate=null이면 날짜 영역이 숨겨진다', () => {
    const ticket = makeTicket({ dueDate: null });
    render(<TicketCard ticket={ticket} onClick={jest.fn()} />);

    expect(screen.queryByTestId('ticket-due-date')).not.toBeInTheDocument();
  });

  test('C001-5: 클릭하면 onClick이 티켓 데이터와 함께 1회 호출된다', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    const ticket = makeTicket();
    render(<TicketCard ticket={ticket} onClick={handleClick} />);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(ticket);
  });

  test('C001-6: 긴 제목에는 말줄임(truncate) 클래스가 적용된다', () => {
    const longTitle = '아주 아주 아주 아주 아주 아주 아주 아주 긴 제목입니다 잘림 테스트용 문자열';
    const ticket = makeTicket({ title: longTitle });
    render(<TicketCard ticket={ticket} onClick={jest.fn()} />);

    expect(screen.getByText(longTitle)).toHaveClass('truncate');
  });

  test('C001-7: 우선순위별로 뱃지에 data-priority 속성이 붙는다', () => {
    const { rerender } = render(<TicketCard ticket={makeTicket({ priority: 'LOW' })} onClick={jest.fn()} />);
    expect(screen.getByText('낮음')).toHaveAttribute('data-priority', 'LOW');

    rerender(<TicketCard ticket={makeTicket({ priority: 'MEDIUM' })} onClick={jest.fn()} />);
    expect(screen.getByText('보통')).toHaveAttribute('data-priority', 'MEDIUM');

    rerender(<TicketCard ticket={makeTicket({ priority: 'HIGH' })} onClick={jest.fn()} />);
    expect(screen.getByText('높음')).toHaveAttribute('data-priority', 'HIGH');
  });
});
