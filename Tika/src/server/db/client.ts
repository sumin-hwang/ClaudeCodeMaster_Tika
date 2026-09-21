import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const queryClient = postgres(process.env.DATABASE_URL!, { idle_timeout: 5 });
export const db = drizzle(queryClient);
