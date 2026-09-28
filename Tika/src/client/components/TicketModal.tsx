import { useState } from 'react';
import { Modal } from '@/client/components/Modal';
import { TicketForm } from '@/client/components/TicketForm';
import { TicketDetailView } from '@/client/components/TicketDetailView';
import { ConfirmDialog } from '@/client/components/ConfirmDialog';
import { Button } from '@/client/components/Button';
import type { CreateTicketInput, Ticket, UpdateTicketInput } from '@/shared/types';

interface TicketModalProps {
  mode: 'create' | 'edit';
  ticket?: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTicketInput | UpdateTicketInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export const TicketModal = ({ mode, ticket, isOpen, onClose, onSubmit, onDelete }: TicketModalProps) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const initialValues = ticket
    ? {
        title: ticket.title,
        description: ticket.description ?? undefined,
        priority: ticket.priority,
        plannedStartDate: ticket.plannedStartDate ?? undefined,
        dueDate: ticket.dueDate ?? undefined,
      }
    : undefined;

  const handleFormSubmit = async (data: CreateTicketInput) => {
    await onSubmit(data);
    onClose();
  };

  const handleConfirmDelete = async () => {
    setIsConfirmOpen(false);
    await onDelete?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-lg font-semibold text-text">{mode === 'create' ? '새 티켓' : '티켓 수정'}</h2>

      {mode === 'edit' && ticket && (
        <div className="mt-2">
          <TicketDetailView ticket={ticket} />
        </div>
      )}

      <div className="mt-4">
        <TicketForm
          initialValues={initialValues}
          onSubmit={handleFormSubmit}
          submitLabel={mode === 'create' ? '생성' : '수정'}
        />
      </div>

      <div className="mt-2">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      </div>

      {mode === 'edit' && (
        <div className="mt-4">
          <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
            삭제
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="티켓 삭제"
        message="정말 삭제하시겠습니까?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </Modal>
  );
};
