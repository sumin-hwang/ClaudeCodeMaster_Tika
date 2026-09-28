/**
 * TicketModal: Modal + TicketDetailView + TicketForm + ConfirmDialog 조합
 * 참고: docs/TEST_CASES.md TC-COMP-004-05, TC-COMP-005-01/02, docs/COMPONENT_SPEC.md 5.1
 *
 * 삭제는 2단계 확인: "삭제" 버튼 클릭 → ConfirmDialog 오픈(이 시점엔 onDelete 미호출) →
 * ConfirmDialog "확인" 클릭 → onDelete 호출 + TicketModal onClose 호출.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketModal } from '@/client/components/TicketModal';
import type { Ticket } from '@/shared/types';

const ticket: Ticket = {
  id: 1,
  title: '기존 제목',
  description: '기존 설명',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  position: 0,
  plannedStartDate: null,
  dueDate: null,
  startedAt: '2026-09-01T00:00:00.000Z',
  completedAt: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

describe('TicketModal', () => {
  test('생성 모드 — 삭제 버튼과 상세 정보(TicketDetailView)가 없다', () => {
    render(<TicketModal mode="create" isOpen onClose={jest.fn()} onSubmit={jest.fn()} />);

    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('detail-status')).not.toBeInTheDocument();
  });

  test('TC-COMP-004-05: 생성 모드에서 제출 성공 시 onSubmit 호출 후 onClose가 1회 호출된다', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn().mockResolvedValue(undefined);
    const handleClose = jest.fn();
    render(<TicketModal mode="create" isOpen onClose={handleClose} onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('제목'), '새 티켓');
    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: '새 티켓' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('TC-COMP-005-01: 수정 모드 진입 시 기존 값으로 폼이 채워지고 상세 정보가 표시된다', () => {
    render(<TicketModal mode="edit" ticket={ticket} isOpen onClose={jest.fn()} onSubmit={jest.fn()} />);

    expect(screen.getByLabelText('제목')).toHaveValue('기존 제목');
    expect(screen.getByLabelText('설명')).toHaveValue('기존 설명');
    expect(screen.getByTestId('detail-status')).toHaveTextContent('IN_PROGRESS');
    expect(screen.getByTestId('detail-startedAt')).toHaveTextContent('2026-09-01');
  });

  test('TC-COMP-005-02: 수정 모드에서 필드 수정 후 제출하면 onSubmit에 변경된 값이 포함된다', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn().mockResolvedValue(undefined);
    render(
      <TicketModal mode="edit" ticket={ticket} isOpen onClose={jest.fn()} onSubmit={handleSubmit} />
    );

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 제목');
    await user.click(screen.getByRole('button', { name: '수정' }));

    expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: '수정된 제목' }));
  });

  test('삭제 버튼 클릭(1단계) 시 ConfirmDialog가 열리고 onDelete는 아직 호출되지 않는다', async () => {
    const user = userEvent.setup();
    const handleDelete = jest.fn();
    render(
      <TicketModal
        mode="edit"
        ticket={ticket}
        isOpen
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        onDelete={handleDelete}
      />
    );

    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument();
    expect(handleDelete).not.toHaveBeenCalled();
  });

  test('ConfirmDialog에서 "취소" 클릭 시 onDelete는 호출되지 않고 TicketModal은 계속 열려 있다', async () => {
    const user = userEvent.setup();
    const handleDelete = jest.fn();
    render(
      <TicketModal
        mode="edit"
        ticket={ticket}
        isOpen
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        onDelete={handleDelete}
      />
    );

    await user.click(screen.getByRole('button', { name: '삭제' }));
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(handleDelete).not.toHaveBeenCalled();
    expect(screen.getByLabelText('제목')).toBeInTheDocument();
  });

  test('ConfirmDialog에서 "확인" 클릭(2단계) 시 onDelete와 onClose가 각각 1회 호출된다', async () => {
    const user = userEvent.setup();
    const handleDelete = jest.fn().mockResolvedValue(undefined);
    const handleClose = jest.fn();
    render(
      <TicketModal
        mode="edit"
        ticket={ticket}
        isOpen
        onClose={handleClose}
        onSubmit={jest.fn()}
        onDelete={handleDelete}
      />
    );

    await user.click(screen.getByRole('button', { name: '삭제' }));
    await user.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(handleDelete).toHaveBeenCalledTimes(1));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
