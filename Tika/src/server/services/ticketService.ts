import { asc, eq } from 'drizzle-orm';
import { db, tickets } from '@/server/db';
import type { CreateTicketInput } from '@/shared/validations/ticket';

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
