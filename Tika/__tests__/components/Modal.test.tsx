import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/client/components/Modal';

describe('Modal', () => {
  test('isOpen=false면 렌더되지 않고, isOpen=true면 렌더된다', () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={jest.fn()}>
        <p>모달 내용</p>
      </Modal>
    );
    expect(screen.queryByText('모달 내용')).not.toBeInTheDocument();

    rerender(
      <Modal isOpen onClose={jest.fn()}>
        <p>모달 내용</p>
      </Modal>
    );
    expect(screen.getByText('모달 내용')).toBeInTheDocument();
  });

  test('ESC 키를 누르면 onClose가 호출된다', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();
    render(
      <Modal isOpen onClose={handleClose}>
        <p>모달 내용</p>
      </Modal>
    );

    await user.keyboard('{Escape}');

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('오버레이(배경) 클릭 시 onClose가 호출된다', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();
    render(
      <Modal isOpen onClose={handleClose}>
        <p>모달 내용</p>
      </Modal>
    );

    await user.click(screen.getByTestId('modal-overlay'));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('모달 컨텐츠 클릭은 무시되어 onClose가 호출되지 않는다', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();
    render(
      <Modal isOpen onClose={handleClose}>
        <p>모달 내용</p>
      </Modal>
    );

    await user.click(screen.getByText('모달 내용'));

    expect(handleClose).not.toHaveBeenCalled();
  });

  test('role="dialog"와 aria-modal="true"를 가진다', () => {
    render(
      <Modal isOpen onClose={jest.fn()}>
        <p>모달 내용</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
