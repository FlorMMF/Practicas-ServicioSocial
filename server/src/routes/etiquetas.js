import { Router } from 'express';
import { pool } from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { ah } from '../utils.js';

const router = Router();
const ADMIN = requireRole('ADMIN');

router.get(
  '/',
  ah(async (req, res) => {
    const { tipo, activa } = req.query;
    const conds = [];
    const params = [];
    if (tipo) {
      params.push(tipo);
      conds.push(`tipo = $${params.length}`);
    }
    if (activa === 'true' || activa === 'false') {
      params.push(activa === 'true');
      conds.push(`activa = $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT * FROM etiqueta ${where} ORDER BY tipo, titulo`,
      params
    );
    res.json(rows);
  })
);

router.post(
  '/',
  ADMIN,
  ah(async (req, res) => {
    const { titulo, descripcion, tipo, activa = true } = req.body ?? {};
    if (!titulo || !descripcion || !tipo)
      return res
        .status(400)
        .json({ error: 'Título, descripción y tipo son obligatorios' });
    const { rows } = await pool.query(
      'INSERT INTO etiqueta (titulo, descripcion, tipo, activa) VALUES ($1,$2,$3,$4) RETURNING *',
      [titulo, descripcion, tipo, !!activa]
    );
    res.status(201).json(rows[0]);
  })
);

router.put(
  '/:id',
  ADMIN,
  ah(async (req, res) => {
    const { titulo, descripcion, tipo, activa } = req.body ?? {};
    if (!titulo || !descripcion || !tipo)
      return res
        .status(400)
        .json({ error: 'Título, descripción y tipo son obligatorios' });
    const { rows } = await pool.query(
      `UPDATE etiqueta SET titulo=$1, descripcion=$2, tipo=$3, activa=$4
       WHERE id_etiqueta=$5 RETURNING *`,
      [titulo, descripcion, tipo, !!activa, req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    res.json(rows[0]);
  })
);

router.delete(
  '/:id',
  ADMIN,
  ah(async (req, res) => {
    const { rowCount } = await pool.query(
      'DELETE FROM etiqueta WHERE id_etiqueta = $1',
      [req.params.id]
    );
    if (!rowCount)
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    res.json({ ok: true });
  })
);

export default router;
