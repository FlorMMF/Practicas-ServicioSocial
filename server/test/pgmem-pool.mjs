/*
Crea una base Postgres en memoria (pg-mem) con el esquema y datos de
db/init/*.sql. Se usa solo para pruebas sin Docker (PG_MEM=1).
*/
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { newDb, DataType } from 'pg-mem';
import bcrypt from 'bcryptjs';

export function statements(file) {
  const initDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'db', 'init');
  return readFileSync(join(initDir, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/;\s*(?=\n|$)/)
    .map((s) => s.replace(/^(--[^\n]*\n)+/, '').trim())
    .filter(Boolean);
}

export function createMemDb() {
  const db = newDb();
  // pgcrypto no existe en pg-mem: lo emulamos con bcryptjs
  db.public.registerFunction({
    name: 'gen_salt',
    args: [DataType.text],
    returns: DataType.text,
    implementation: () => bcrypt.genSaltSync(10),
  });
  db.public.registerFunction({
    name: 'crypt',
    args: [DataType.text, DataType.text],
    returns: DataType.text,
    implementation: (pw, salt) => bcrypt.hashSync(pw, salt),
  });
  for (const file of ['01_schema_y_datos.sql', '02_ajustes.sql']) {
    for (const stmt of statements(file)) {
      db.public.none(
        stmt
          .replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto/i, 'SELECT 1')
          // pg-mem nombra las FK automáticas como <tabla>_<col>_fk (sin "ey")
          .replace(/(DROP CONSTRAINT IF EXISTS \w+?)_fkey/g, '$1_fk')
      );
    }
  }
  return db;
}

const memDb = createMemDb();
const { Pool } = memDb.adapters.createPg();
export const pool = new Pool();
