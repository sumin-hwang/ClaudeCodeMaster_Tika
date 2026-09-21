import { db } from './client';
import { tickets } from './schema';

export { db, tickets };

export async function resetTickets() {
  await db.delete(tickets);
}
