// 임시 구현: 실제 Neon/Vercel Postgres 연결 정보(POSTGRES_URL)가 준비되면
// 이 파일만 drizzle-orm/vercel-postgres + @vercel/postgres 기반으로 교체한다.
// schema.ts / ticketService.ts / route.ts는 변경할 필요 없다.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

export const client = new PGlite();
export const db = drizzle(client);
