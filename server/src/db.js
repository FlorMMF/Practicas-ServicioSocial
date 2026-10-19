import 'dotenv/config';
import pg from 'pg';

// PG_MEM=1 usa una Postgres en memoria (solo pruebas locales sin Docker)
export const pool = process.env.PG_MEM
  ? (await import('../test/pgmem-pool.mjs')).pool
  : new pg.Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgres://practicas:practicas@localhost:5432/practicas',
    });
