/**
 * Board: Backlog 사이드바 + 3컬럼 메인 레이아웃
 * 참고: docs/COMPONENT_SPEC.md 3.1(BoardPage), 7장(반응형 레이아웃)
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Board } from '@/client/components/Board';
import type { BoardData, TicketWithMeta } from '@/shared/types';

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
  status: 'BACKLOG',
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

const board: BoardData['board'] = {
  BACKLOG: [makeTicket({ id: 1, title: '백로그 티켓', status: 'BACKLOG' })],
  TODO: [makeTicket({ id: 2, title: '할일 티켓', status: 'TODO' })],
  IN_PROGRESS: [makeTicket({ id: 3, title: '진행 티켓', status: 'IN_PROGRESS' })],
  DONE: [makeTicket({ id: 4, title: '완료 티켓', status: 'DONE' })],
};

describe('Board', () => {
  test('Backlog 영역이 사이드바로 렌더된다', () => {
    render(<Board board={board} onCardClick={jest.fn()} />);

    const sidebar = screen.getByTestId('backlog-sidebar');
    expect(within(sidebar).getByRole('heading', { name: 'Backlog' })).toBeInTheDocument();
    expect(within(sidebar).getByText('백로그 티켓')).toBeInTheDocument();
  });

  test('TODO/In Progress/Done 3개 컬럼이 메인 영역에 렌더된다', () => {
    render(<Board board={board} onCardClick={jest.fn()} />);

    const main = screen.getByTestId('board-main');
    expect(within(main).getByRole('heading', { name: 'TODO' })).toBeInTheDocument();
    expect(within(main).getByRole('heading', { name: 'In Progress' })).toBeInTheDocument();
    expect(within(main).getByRole('heading', { name: 'Done' })).toBeInTheDocument();
  });

  test('각 컬럼에는 해당 status의 티켓만 전달된다', () => {
    render(<Board board={board} onCardClick={jest.fn()} />);

    const sidebar = screen.getByTestId('backlog-sidebar');
    const main = screen.getByTestId('board-main');

    expect(within(sidebar).queryByText('할일 티켓')).not.toBeInTheDocument();
    expect(within(main).queryByText('백로그 티켓')).not.toBeInTheDocument();
    expect(within(main).getByText('할일 티켓')).toBeInTheDocument();
    expect(within(main).getByText('진행 티켓')).toBeInTheDocument();
    expect(within(main).getByText('완료 티켓')).toBeInTheDocument();
  });

  test('카드 클릭 시 onCardClick이 해당 ticket과 함께 호출된다', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(<Board board={board} onCardClick={handleClick} />);

    await user.click(screen.getByText('할일 티켓'));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(board.TODO[0]);
  });
});
