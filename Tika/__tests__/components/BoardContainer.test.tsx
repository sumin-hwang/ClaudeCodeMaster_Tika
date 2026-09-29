/**
 * BoardContainer (FE-T601, 원래 계획명 BoardPage): useTickets + useDragAndDrop을 사용해
 * BoardHeader + Board + TicketModal을 배선하는 최상위 클라이언트 컴포넌트.
 * useTickets/useDragAndDrop 자체 로직은 각 훅의 단위 테스트에서 이미 검증됐으므로,
 * 여기서는 컴포지션(배선)만 검증한다.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardContainer } from '@/client/components/BoardContainer';
import { useTickets } from '@/client/hooks/useTickets';
import { useDragAndDrop } from '@/client/hooks/useDragAndDrop';
import type { BoardData, TicketWithMeta } from '@/shared/types';

jest.mock('@/client/hooks/useTickets');
jest.mock('@/client/hooks/useDragAndDrop');

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

const mockedUseTickets = useTickets as jest.Mock;
const mockedUseDragAndDrop = useDragAndDrop as jest.Mock;

const EMPTY_BOARD: BoardData['board'] = { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] };

const makeTicket = (overrides: Partial<TicketWithMeta> = {}): TicketWithMeta => ({
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
  ...overrides,
});

let create: jest.Mock;
let update: jest.Mock;
let remove: jest.Mock;
let board: BoardData['board'];

beforeEach(() => {
  create = jest.fn().mockResolvedValue(undefined);
  update = jest.fn().mockResolvedValue(undefined);
  remove = jest.fn().mockResolvedValue(undefined);
  board = { ...EMPTY_BOARD, TODO: [makeTicket({ id: 1, title: '할일 티켓' })] };

  mockedUseTickets.mockReturnValue({
    board,
    isLoading: false,
    error: null,
    create,
    update,
    remove,
    reorder: jest.fn(),
    complete: jest.fn(),
  });
  mockedUseDragAndDrop.mockReturnValue({ sensors: [], onDragEnd: jest.fn() });
});

describe('BoardContainer', () => {
  test('초기 board 데이터로 Board가 렌더된다', () => {
    render(<BoardContainer initialData={EMPTY_BOARD} />);

    expect(screen.getByText('할일 티켓')).toBeInTheDocument();
  });

  test('"새 업무" 클릭 시 생성 모드 TicketModal이 열린다', async () => {
    const user = userEvent.setup();
    render(<BoardContainer initialData={EMPTY_BOARD} />);

    await user.click(screen.getByRole('button', { name: '새 업무' }));

    expect(screen.getByLabelText('제목')).toHaveValue('');
    expect(screen.getByRole('button', { name: '생성' })).toBeInTheDocument();
  });

  test('카드 클릭 시 해당 티켓의 수정 모드 TicketModal이 열린다', async () => {
    const user = userEvent.setup();
    render(<BoardContainer initialData={EMPTY_BOARD} />);

    await user.click(screen.getByText('할일 티켓'));

    expect(screen.getByLabelText('제목')).toHaveValue('할일 티켓');
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
  });

  test('생성 폼 제출 시 create가 호출되고 모달이 닫힌다', async () => {
    const user = userEvent.setup();
    render(<BoardContainer initialData={EMPTY_BOARD} />);

    await user.click(screen.getByRole('button', { name: '새 업무' }));
    await user.type(screen.getByLabelText('제목'), '새 티켓');
    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ title: '새 티켓' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('수정 폼 제출 시 update가 호출되고 모달이 닫힌다', async () => {
    const user = userEvent.setup();
    render(<BoardContainer initialData={EMPTY_BOARD} />);

    await user.click(screen.getByText('할일 티켓'));
    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 제목');
    await user.click(screen.getByRole('button', { name: '수정' }));

    expect(update).toHaveBeenCalledWith(1, expect.objectContaining({ title: '수정된 제목' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('삭제 2단계 확인 시 remove가 호출되고 모달이 닫힌다', async () => {
    const user = userEvent.setup();
    render(<BoardContainer initialData={EMPTY_BOARD} />);

    await user.click(screen.getByText('할일 티켓'));
    await user.click(screen.getByRole('button', { name: '삭제' }));
    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(remove).toHaveBeenCalledWith(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
