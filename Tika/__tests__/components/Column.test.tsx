/**
 * Column: SortableContext + useDroppable + 빈 컬럼 안내
 * 참고: docs/COMPONENT_SPEC.md 3.3 (BoardColumn), docs/TEST_CASES.md TC-COMP-002
 *
 * @dnd-kit는 DndContext 없이 단위 테스트할 수 없으므로 mock 처리한다.
 * Column이 내부에서 렌더하는 TicketCard도 @dnd-kit/sortable의 useSortable을 쓰므로 함께 mock한다.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDroppable } from '@dnd-kit/core';
import { Column } from '@/client/components/Column';
import type { TicketWithMeta } from '@/shared/types';

jest.mock('@dnd-kit/core', () => ({
  useDroppable: jest.fn(() => ({ setNodeRef: jest.fn(), isOver: false })),
}));

jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: jest.fn(),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

const baseTicket: TicketWithMeta = {
  id: 1,
  title: '티켓',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  position: 0,
  plannedStartDate: null,
  dueDate: null,
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

describe('Column', () => {
  test('헤더에 title과 카드 수가 표시된다', () => {
    const tickets = [makeTicket({ id: 1 }), makeTicket({ id: 2 }), makeTicket({ id: 3 })];
    render(<Column status="TODO" title="TODO" tickets={tickets} onCardClick={jest.fn()} />);

    expect(screen.getByRole('heading', { name: 'TODO' })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('tickets를 전달받은 순서(position 오름차순) 그대로 렌더한다', () => {
    const tickets = [
      makeTicket({ id: 1, title: '첫번째', position: 0 }),
      makeTicket({ id: 2, title: '두번째', position: 1024 }),
      makeTicket({ id: 3, title: '세번째', position: 2048 }),
    ];
    render(<Column status="TODO" title="TODO" tickets={tickets} onCardClick={jest.fn()} />);

    const titles = screen.getAllByRole('button').map((el) => el.textContent);
    expect(titles[0]).toContain('첫번째');
    expect(titles[1]).toContain('두번째');
    expect(titles[2]).toContain('세번째');
  });

  test('빈 컬럼이면 카드 수 "0"이 표시된다', () => {
    render(<Column status="TODO" title="TODO" tickets={[]} onCardClick={jest.fn()} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('빈 컬럼이면 안내 문구가 표시된다', () => {
    render(<Column status="TODO" title="TODO" tickets={[]} onCardClick={jest.fn()} />);

    expect(screen.getByText('카드가 없습니다')).toBeInTheDocument();
  });

  test('카드가 있으면 안내 문구가 표시되지 않는다', () => {
    render(<Column status="TODO" title="TODO" tickets={[makeTicket()]} onCardClick={jest.fn()} />);

    expect(screen.queryByText('카드가 없습니다')).not.toBeInTheDocument();
  });

  test('전달된 tickets 개수만큼 TicketCard가 렌더된다', () => {
    const tickets = [makeTicket({ id: 1 }), makeTicket({ id: 2 })];
    render(<Column status="TODO" title="TODO" tickets={tickets} onCardClick={jest.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  test('TicketCard 클릭 시 onCardClick이 해당 ticket과 함께 호출된다', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    const ticket = makeTicket({ id: 1, title: '클릭 대상' });
    render(<Column status="TODO" title="TODO" tickets={[ticket]} onCardClick={handleClick} />);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(ticket);
  });

  test('useDroppable이 status를 id로 호출되어 드롭 가능 영역으로 등록된다', () => {
    render(<Column status="TODO" title="TODO" tickets={[]} onCardClick={jest.fn()} />);

    expect(useDroppable).toHaveBeenCalledWith({ id: 'TODO' });
  });
});
