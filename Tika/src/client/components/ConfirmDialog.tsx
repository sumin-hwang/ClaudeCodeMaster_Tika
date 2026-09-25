import { Modal } from '@/client/components/Modal';
import { Button } from '@/client/components/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <p className="mt-2 text-sm text-text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          확인
        </Button>
      </div>
    </Modal>
  );
};
