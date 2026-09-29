'use client';

import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { useTickets } from '@/client/hooks/useTickets';
import { useDragAndDrop } from '@/client/hooks/useDragAndDrop';
import { BoardHeader } from '@/client/components/BoardHeader';
import { Board } from '@/client/components/Board';
import { TicketModal } from '@/client/components/TicketModal';
import type { BoardData, CreateTicketInput, TicketWithMeta, UpdateTicketInput } from '@/shared/types';

interface BoardContainerProps {
  initialData: BoardData['board'];
}

type ActiveModal = { mode: 'create' } | { mode: 'edit'; ticket: TicketWithMeta };

export const BoardContainer = ({ initialData }: BoardContainerProps) => {
  const { board, create, update, remove, reorder, complete } = useTickets(initialData);
  const { sensors, onDragEnd } = useDragAndDrop({ board, reorder, complete });
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);

  const handleCreateClick = () => setActiveModal({ mode: 'create' });
  const handleCardClick = (ticket: TicketWithMeta) => setActiveModal({ mode: 'edit', ticket });
  const handleClose = () => setActiveModal(null);

  const handleSubmit = async (data: CreateTicketInput | UpdateTicketInput) => {
    if (activeModal?.mode === 'edit') {
      await update(activeModal.ticket.id, data as UpdateTicketInput);
    } else {
      await create(data as CreateTicketInput);
    }
  };

  const handleDelete = async () => {
    if (activeModal?.mode === 'edit') {
      await remove(activeModal.ticket.id);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <BoardHeader onCreateClick={handleCreateClick} />
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <Board board={board} onCardClick={handleCardClick} />
      </DndContext>
      <TicketModal
        mode={activeModal?.mode ?? 'create'}
        ticket={activeModal?.mode === 'edit' ? activeModal.ticket : undefined}
        isOpen={activeModal !== null}
        onClose={handleClose}
        onSubmit={handleSubmit}
        onDelete={activeModal?.mode === 'edit' ? handleDelete : undefined}
      />
    </div>
  );
};
