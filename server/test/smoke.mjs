/*
Smoke test del esquema y datos usando pg-mem (Postgres en memoria).
No reemplaza a la base real (docker compose), pero valida que:
 - 01_schema_y_datos.sql y 02_ajustes.sql se ejecuten sin errores
 - los datos de ejemplo queden cargados
 - las 7 consultas de reporte devuelvan filas
 - el hash de contraseñas sea verificable con bcryptjs

Uso: node test/smoke.mjs   (desde server/)
*/
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { newDb, DataType } from 'pg-mem';
import bcrypt from 'bcryptjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const initDir = join(root, 'db', 'init');

const db = newDb();

// pgcrypto no existe en pg-mem: lo emulamos con bcryptjs para el test
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

function statements(file) {
  return file
    .replace(/\/\*[\s\S]*?\*\//g, '') // quita comentarios de bloque
    .split(/;\s*(?=\n|$)/)
    .map((s) => s.replace(/^(--[^\n]*\n)+/, '').trim()) // quita comentarios de línea al inicio
    .filter(Boolean);
}

let fallos = 0;
for (const file of ['01_schema_y_datos.sql', '02_ajustes.sql']) {
  const sql = readFileSync(join(initDir, file), 'utf8');
  for (const stmt of statements(sql)) {
    const s = stmt.replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto/i, 'SELECT 1');
    try {
      db.public.none(s);
    } catch (e) {
      fallos++;
      console.error(`[${file}] FALLO: ${e.message}\n  -> ${s.slice(0, 80)}...`);
    }
  }
  console.log(`${file}: OK`);
}

const q = (sql, params) => db.public.many(sql, params);

const conteos = {
  usuario: 8,
  estudiante: 7,
  administrador: 1,
  etiqueta: 11,
  empresa: 6,
  oferta: 7,
  contacto: 6,
  notificacion: 6,
  estudiante_preferencia: 15,
  oferta_etiqueta: 15,
};
for (const [tabla, esperado] of Object.entries(conteos)) {
  const n = Number(q(`SELECT count(*) AS n FROM ${tabla}`)[0].n);
  console.log(`${tabla}: ${n} (esperado ${esperado}) ${n === esperado ? 'OK' : 'FALLO'}`);
  if (n !== esperado) fallos++;
}

// Las 7 consultas de reporte del documento deben devolver filas
const { CONSULTAS } = await import('../src/routes/reportes.js');
for (const [nombre, sql] of Object.entries(CONSULTAS)) {
  try {
    const rows = q(sql);
    console.log(`reporte ${nombre}: ${rows.length} filas ${rows.length ? 'OK' : 'FALLO'}`);
    if (!rows.length) fallos++;
  } catch (e) {
    fallos++;
    console.error(`reporte ${nombre}: FALLO -> ${e.message}`);
  }
}

// Login: las contraseñas hasheadas deben validarse con bcrypt
const admin = q(`SELECT password FROM usuario WHERE correo = 'admin@unison.mx'`)[0];
if (bcrypt.compareSync('admin123', admin.password)) {
  console.log('hash de contraseña (admin123): OK');
} else {
  fallos++;
  console.error('hash de contraseña: FALLO');
}

// Prueba de integridad: expediente duplicado debe fallar
try {
  db.public.none(
    `INSERT INTO estudiante (expediente, id_usuario, v_servicio, estado, carrera, semestre)
     VALUES (22010001, 2, false, 'ACTIVO', 'X', 6)`
  );
  fallos++;
  console.error('integridad (expediente duplicado): FALLO — no se rechazó');
} catch {
  console.log('integridad (expediente duplicado): OK');
}

console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo OK');
process.exit(fallos ? 1 : 0);
