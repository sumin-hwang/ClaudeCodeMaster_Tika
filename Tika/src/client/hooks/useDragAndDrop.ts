'use client';

import { useMemo } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { BoardData, ReorderTicketInput, TicketStatus } from '@/shared/types';

const STATUS_LIST: TicketStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'];

interface UseDragAndDropParams {
  board: BoardData['board'];
  reorder: (input: ReorderTicketInput) => void;
  complete: (id: number) => void;
}

function resolveDropTarget(
  board: BoardData['board'],
  activeId: number,
  over: DragEndEvent['over']
): { status: TicketStatus; position: number } | null {
  if (!over) return null;

  const overData = over.data.current as { status?: TicketStatus } | undefined;
  const candidateStatus = overData?.status ?? over.id;
  if (!STATUS_LIST.includes(candidateStatus as TicketStatus)) return null;

  const targetStatus = candidateStatus as TicketStatus;
  const siblings = board[targetStatus].filter((t) => t.id !== activeId);
  const overIndex = siblings.findIndex((t) => t.id === over.id);
  const position = overIndex === -1 ? siblings.length : overIndex;

  return { status: targetStatus, position };
}

export function useDragAndDrop({ board, reorder, complete }: UseDragAndDropParams) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = useMemo(
    () => (event: DragEndEvent) => {
      const target = resolveDropTarget(board, Number(event.active.id), event.over);
      if (!target) return;

      if (target.status === 'DONE') {
        complete(Number(event.active.id));
        return;
      }

      reorder({ ticketId: Number(event.active.id), status: target.status, position: target.position });
    },
    [board, reorder, complete]
  );

  return { sensors, onDragEnd };
}
