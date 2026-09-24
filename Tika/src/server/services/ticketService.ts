import { and, asc, eq, ne } from 'drizzle-orm';
import { db, tickets } from '@/server/db';
import type {
  CreateTicketInput,
  ReorderTicketInput,
  UpdateTicketInput,
} from '@/shared/validations/ticket';

type Ticket = typeof tickets.$inferSelect;

function isOverdue(ticket: Ticket): boolean {
  if (!ticket.dueDate) return false;
  if (ticket.status === 'DONE') return false;
  const today = new Date().toISOString().split('T')[0];
  return ticket.dueDate < today;
}

function isDoneVisible(ticket: Ticket): boolean {
  if (ticket.status !== 'DONE' || !ticket.completedAt) return false;
  return Date.now() - ticket.completedAt.getTime() <= 24 * 60 * 60 * 1000;
}

function withOverdue(ticket: Ticket) {
  return { ...ticket, isOverdue: isOverdue(ticket) };
}

export async function createTicket(input: CreateTicketInput) {
  const [lowest] = await db
    .select({ position: tickets.position })
    .from(tickets)
    .where(eq(tickets.status, 'BACKLOG'))
    .orderBy(asc(tickets.position))
    .limit(1);

  const position = lowest ? lowest.position - 1024 : 0;

  const [ticket] = await db
    .insert(tickets)
    .values({
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? 'MEDIUM',
      plannedStartDate: input.plannedStartDate ?? null,
      dueDate: input.dueDate ?? null,
      position,
    })
    .returning();

  return ticket;
}

export async function getBoard() {
  const all = await db.select().from(tickets).orderBy(asc(tickets.position));

  const board = {
    BACKLOG: [] as ReturnType<typeof withOverdue>[],
    TODO: [] as ReturnType<typeof withOverdue>[],
    IN_PROGRESS: [] as ReturnType<typeof withOverdue>[],
    DONE: [] as ReturnType<typeof withOverdue>[],
  };

  for (const ticket of all) {
    if (ticket.status === 'DONE') {
      if (isDoneVisible(ticket)) board.DONE.push(withOverdue(ticket));
      continue;
    }
    board[ticket.status as 'BACKLOG' | 'TODO' | 'IN_PROGRESS'].push(withOverdue(ticket));
  }

  const total =
    board.BACKLOG.length + board.TODO.length + board.IN_PROGRESS.length + board.DONE.length;

  return { board, total };
}

export async function getTicketById(id: number) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  return ticket ? withOverdue(ticket) : null;
}

export async function updateTicket(id: number, input: UpdateTicketInput) {
  const updates: Partial<typeof tickets.$inferInsert> = {};

  if ('title' in input) updates.title = input.title;
  if ('description' in input) updates.description = input.description;
  if ('priority' in input) updates.priority = input.priority;
  if ('plannedStartDate' in input) updates.plannedStartDate = input.plannedStartDate;
  if ('dueDate' in input) updates.dueDate = input.dueDate;

  if (Object.keys(updates).length === 0) {
    // 유효한 수정 필드가 하나도 없으면 DB를 건드리지 않고 현재 상태를 그대로 반환한다.
    return getTicketById(id);
  }

  const [ticket] = await db
    .update(tickets)
    .set(updates)
    .where(eq(tickets.id, id))
    .returning();

  return ticket ? withOverdue(ticket) : null;
}

export async function completeTicket(id: number) {
  const [lowest] = await db
    .select({ position: tickets.position })
    .from(tickets)
    .where(eq(tickets.status, 'DONE'))
    .orderBy(asc(tickets.position))
    .limit(1);

  const position = lowest ? lowest.position - 1024 : 0;

  const [ticket] = await db
    .update(tickets)
    .set({ status: 'DONE', completedAt: new Date(), position })
    .where(eq(tickets.id, id))
    .returning();

  return ticket ?? null;
}

export async function deleteTicket(id: number): Promise<boolean> {
  const deleted = await db.delete(tickets).where(eq(tickets.id, id)).returning({ id: tickets.id });
  return deleted.length > 0;
}

export async function reorderTicket(input: ReorderTicketInput) {
  const [current] = await db.select().from(tickets).where(eq(tickets.id, input.ticketId)).limit(1);
  if (!current) return null;

  const columnTickets = await db
    .select({ id: tickets.id, position: tickets.position })
    .from(tickets)
    .where(and(eq(tickets.status, input.status), ne(tickets.id, input.ticketId)))
    .orderBy(asc(tickets.position));

  const insertIndex = Math.max(0, Math.min(input.position, columnTickets.length));
  const prev = columnTickets[insertIndex - 1];
  const next = columnTickets[insertIndex];

  let newPosition: number;
  const affected: { id: number; position: number }[] = [];

  if (!prev && !next) {
    newPosition = 0;
  } else if (!prev) {
    newPosition = next.position - 1024;
  } else if (!next) {
    newPosition = prev.position + 1024;
  } else if (next.position - prev.position < 1) {
    // 재정렬: 이동 티켓을 insertIndex 자리에 끼운 순서로 전체 1024 간격 재배치
    const merged = [
      ...columnTickets.slice(0, insertIndex),
      { id: input.ticketId, position: 0 },
      ...columnTickets.slice(insertIndex),
    ];
    newPosition = 0;
    merged.forEach((t, i) => {
      const pos = i * 1024;
      if (t.id === input.ticketId) {
        newPosition = pos;
      } else {
        affected.push({ id: t.id, position: pos });
      }
    });
  } else {
    newPosition = Math.floor((prev.position + next.position) / 2);
  }

  const updates: Partial<typeof tickets.$inferInsert> = {
    status: input.status,
    position: newPosition,
  };
  if (input.status === 'TODO' && current.status !== 'TODO') {
    updates.startedAt = new Date();
  }
  if (input.status === 'BACKLOG' && current.status === 'TODO') {
    updates.startedAt = null;
  }
  if (current.status === 'DONE') {
    // reorderTicketSchema가 input.status를 BACKLOG/TODO/IN_PROGRESS로만 허용하므로
    // 이 분기에 도달했다는 것 자체가 "Done에서 다른 칼럼으로 이동"을 의미한다.
    updates.completedAt = null;
  }

  const [ticket] = await db.transaction(async (tx) => {
    for (const a of affected) {
      await tx.update(tickets).set({ position: a.position }).where(eq(tickets.id, a.id));
    }
    return tx.update(tickets).set(updates).where(eq(tickets.id, input.ticketId)).returning();
  });

  return { ticket, affected };
}
