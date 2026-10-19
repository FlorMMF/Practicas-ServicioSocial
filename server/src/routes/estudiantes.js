import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { ah } from '../utils.js';

const router = Router();
router.use(requireRole('ADMIN'));

const SELECT_EST = `
SELECT es.expediente, es.id_usuario, es.v_servicio, es.fecha_v_servicio,
       es.estado, es.carrera, es.semestre,
       u.nombre, u.correo
FROM estudiante es
INNER JOIN usuario u ON u.id_usuario = es.id_usuario`;

async function conPreferencias(rows) {
  if (!rows.length) return rows;
  const exps = rows.map((r) => r.expediente);
  const ph = exps.map((_, i) => `$${i + 1}`).join(',');
  const { rows: links } = await pool.query(
    `SELECT ep.expediente, et.id_etiqueta AS id, et.titulo, et.tipo
     FROM estudiante_preferencia ep
     INNER JOIN etiqueta et ON et.id_etiqueta = ep.id_etiqueta
     WHERE ep.expediente IN (${ph})
     ORDER BY et.tipo, et.titulo`,
    exps
  );
  return rows.map((r) => ({
    ...r,
    preferencias: links.filter((l) => l.expediente === r.expediente),
  }));
}

router.get(
  '/',
  ah(async (_req, res) => {
    const { rows } = await pool.query(
      `${SELECT_EST} ORDER BY es.semestre DESC, u.nombre ASC`
    );
    res.json(await conPreferencias(rows));
  })
);

router.get(
  '/:expediente',
  ah(async (req, res) => {
    const { rows } = await pool.query(
      `${SELECT_EST} WHERE es.expediente = $1`,
      [req.params.expediente]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    res.json((await conPreferencias(rows))[0]);
  })
);

router.post(
  '/',
  ah(async (req, res) => {
    const b = req.body ?? {};
    const faltan = ['nombre', 'correo', 'password', 'expediente', 'carrera', 'semestre']
      .filter((k) => b[k] === undefined || b[k] === null || b[k] === '');
    if (faltan.length)
      return res.status(400).json({ error: `Faltan campos: ${faltan.join(', ')}` });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const hash = await bcrypt.hash(b.password, 10);
      const usr = await client.query(
        'INSERT INTO usuario (nombre, correo, password) VALUES ($1,$2,$3) RETURNING id_usuario',
        [b.nombre, b.correo, hash]
      );
      const est = await client.query(
        `INSERT INTO estudiante
         (expediente, id_usuario, v_servicio, fecha_v_servicio, estado, carrera, semestre)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          b.expediente,
          usr.rows[0].id_usuario,
          !!b.v_servicio,
          b.fecha_v_servicio || null,
          b.estado || 'ACTIVO',
          b.carrera,
          b.semestre,
        ]
      );
      await client.query('COMMIT');
      res.status(201).json(est.rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  })
);

router.put(
  '/:expediente',
  ah(async (req, res) => {
    const b = req.body ?? {};
    const faltan = ['nombre', 'correo', 'carrera', 'semestre'].filter(
      (k) => b[k] === undefined || b[k] === null || b[k] === ''
    );
    if (faltan.length)
      return res.status(400).json({ error: `Faltan campos: ${faltan.join(', ')}` });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const est = await client.query(
        `UPDATE estudiante SET
           v_servicio=$1, fecha_v_servicio=$2, estado=$3, carrera=$4, semestre=$5
         WHERE expediente=$6 RETURNING id_usuario`,
        [
          !!b.v_servicio,
          b.fecha_v_servicio || null,
          b.estado || 'ACTIVO',
          b.carrera,
          b.semestre,
          req.params.expediente,
        ]
      );
      if (!est.rowCount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Estudiante no encontrado' });
      }
      const idUsuario = est.rows[0].id_usuario;
      await client.query(
        'UPDATE usuario SET nombre=$1, correo=$2 WHERE id_usuario=$3',
        [b.nombre, b.correo, idUsuario]
      );
      if (b.password) {
        const hash = await bcrypt.hash(b.password, 10);
        await client.query(
          'UPDATE usuario SET password=$1 WHERE id_usuario=$2',
          [hash, idUsuario]
        );
      }
      await client.query('COMMIT');
      res.json({ ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  })
);

router.put(
  '/:expediente/preferencias',
  ah(async (req, res) => {
    const ids = req.body?.etiqueta_ids ?? [];
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const est = await client.query(
        'SELECT 1 FROM estudiante WHERE expediente = $1',
        [req.params.expediente]
      );
      if (!est.rowCount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Estudiante no encontrado' });
      }
      await client.query(
        'DELETE FROM estudiante_preferencia WHERE expediente = $1',
        [req.params.expediente]
      );
      for (const id of ids) {
        await client.query(
          `INSERT INTO estudiante_preferencia (expediente, id_etiqueta)
           VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [req.params.expediente, id]
        );
      }
      await client.query('COMMIT');
      res.json({ ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  })
);

router.delete(
  '/:expediente',
  ah(async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const est = await client.query(
        'DELETE FROM estudiante WHERE expediente = $1 RETURNING id_usuario',
        [req.params.expediente]
      );
      if (!est.rowCount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Estudiante no encontrado' });
      }
      await client.query('DELETE FROM usuario WHERE id_usuario = $1', [
        est.rows[0].id_usuario,
      ]);
      await client.query('COMMIT');
      res.json({ ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  })
);

export default router;
