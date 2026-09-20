import { client, db } from './client';
import { tickets } from './schema';

export { db, tickets };

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;

  await client.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'BACKLOG',
      priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
      position INTEGER NOT NULL DEFAULT 1,
      planned_start_date DATE,
      due_date DATE,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    );
  `);

  schemaReady = true;
}

export async function resetTickets() {
  await ensureSchema();
  await db.delete(tickets);
}
