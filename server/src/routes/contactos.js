import { Router } from 'express';
import { pool } from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { ah } from '../utils.js';

const router = Router();
const ADMIN = requireRole('ADMIN');

router.put(
  '/:id',
  ADMIN,
  ah(async (req, res) => {
    const { nombre, correo, telefono, puesto } = req.body ?? {};
    if (!nombre)
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    const { rows } = await pool.query(
      `UPDATE contacto SET nombre=$1, correo=$2, telefono=$3, puesto=$4
       WHERE id_contacto=$5 RETURNING *`,
      [nombre, correo || null, telefono || null, puesto || null, req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Contacto no encontrado' });
    res.json(rows[0]);
  })
);

router.delete(
  '/:id',
  ADMIN,
  ah(async (req, res) => {
    const { rowCount } = await pool.query(
      'DELETE FROM contacto WHERE id_contacto = $1',
      [req.params.id]
    );
    if (!rowCount)
      return res.status(404).json({ error: 'Contacto no encontrado' });
    res.json({ ok: true });
  })
);

export default router;
