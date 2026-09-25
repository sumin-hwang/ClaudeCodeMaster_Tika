import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '@/client/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  test('isOpen=false면 렌더되지 않는다', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="티켓 삭제"
        message="정말 삭제하시겠습니까?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.queryByText('티켓 삭제')).not.toBeInTheDocument();
  });

  test('isOpen=true면 title과 message를 표시한다', () => {
    render(
      <ConfirmDialog
        isOpen
        title="티켓 삭제"
        message="정말 삭제하시겠습니까?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('티켓 삭제')).toBeInTheDocument();
    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument();
  });

  test('"확인" 클릭 시 onConfirm만 1회 호출된다', async () => {
    const user = userEvent.setup();
    const handleConfirm = jest.fn();
    const handleCancel = jest.fn();
    render(
      <ConfirmDialog
        isOpen
        title="티켓 삭제"
        message="정말 삭제하시겠습니까?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleCancel).not.toHaveBeenCalled();
  });

  test('"취소" 클릭 시 onCancel만 1회 호출된다', async () => {
    const user = userEvent.setup();
    const handleConfirm = jest.fn();
    const handleCancel = jest.fn();
    render(
      <ConfirmDialog
        isOpen
        title="티켓 삭제"
        message="정말 삭제하시겠습니까?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(handleConfirm).not.toHaveBeenCalled();
  });

  test('ESC 키를 누르면 onCancel이 호출된다', async () => {
    const user = userEvent.setup();
    const handleCancel = jest.fn();
    render(
      <ConfirmDialog
        isOpen
        title="티켓 삭제"
        message="정말 삭제하시겠습니까?"
        onConfirm={jest.fn()}
        onCancel={handleCancel}
      />
    );

    await user.keyboard('{Escape}');

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
