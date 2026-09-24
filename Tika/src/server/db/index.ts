import { db } from './client.ts';
import { tickets } from './schema.ts';

export { db, tickets };

export async function resetTickets() {
  await db.delete(tickets);
}
