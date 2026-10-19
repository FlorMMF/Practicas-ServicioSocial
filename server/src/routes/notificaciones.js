import { Router } from 'express';
import { pool } from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { ah } from '../utils.js';

const router = Router();
router.use(requireRole('ADMIN'));

router.get(
  '/',
  ah(async (req, res) => {
    const { leida, expediente } = req.query;
    const conds = [];
    const params = [];
    if (leida === 'true' || leida === 'false') {
      params.push(leida === 'true');
      conds.push(`n.leida = $${params.length}`);
    }
    if (expediente) {
      params.push(expediente);
      conds.push(`n.expediente = $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT n.id_notificacion, n.expediente, n.id_oferta, n.titulo,
              n.mensaje, n.leida, n.fecha_creacion,
              u.nombre AS estudiante, o.titulo AS oferta
       FROM notificacion n
       INNER JOIN estudiante es ON n.expediente = es.expediente
       INNER JOIN usuario u ON es.id_usuario = u.id_usuario
       INNER JOIN oferta o ON n.id_oferta = o.id_oferta
       ${where}
       ORDER BY n.fecha_creacion DESC, n.id_notificacion DESC`,
      params
    );
    res.json(rows);
  })
);

router.post(
  '/',
  ah(async (req, res) => {
    const { expediente, id_oferta, titulo, mensaje } = req.body ?? {};
    if (!expediente || !id_oferta || !titulo || !mensaje)
      return res
        .status(400)
        .json({ error: 'Expediente, oferta, título y mensaje son obligatorios' });
    const { rows } = await pool.query(
      `INSERT INTO notificacion (expediente, id_oferta, titulo, mensaje)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [expediente, id_oferta, titulo, mensaje]
    );
    res.status(201).json(rows[0]);
  })
);

router.patch(
  '/:id/leida',
  ah(async (req, res) => {
    const leida = req.body?.leida ?? true;
    const { rows } = await pool.query(
      'UPDATE notificacion SET leida=$1 WHERE id_notificacion=$2 RETURNING *',
      [leida, req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json(rows[0]);
  })
);

router.delete(
  '/:id',
  ah(async (req, res) => {
    const { rowCount } = await pool.query(
      'DELETE FROM notificacion WHERE id_notificacion = $1',
      [req.params.id]
    );
    if (!rowCount)
      return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json({ ok: true });
  })
);

export default router;
