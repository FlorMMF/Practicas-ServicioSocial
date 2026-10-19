import { Router } from 'express';
import { pool } from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { ah } from '../utils.js';

const router = Router();
router.use(requireRole('ESTUDIANTE'));

const exp = (req) => req.user.expediente;

router.get(
  '/perfil',
  ah(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT es.expediente, es.v_servicio, es.fecha_v_servicio, es.estado,
              es.carrera, es.semestre, u.nombre, u.correo
       FROM estudiante es
       INNER JOIN usuario u ON u.id_usuario = es.id_usuario
       WHERE es.expediente = $1`,
      [exp(req)]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    res.json(rows[0]);
  })
);

router.get(
  '/preferencias',
  ah(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT et.id_etiqueta, et.titulo, et.descripcion, et.tipo, et.activa
       FROM estudiante_preferencia ep
       INNER JOIN etiqueta et ON et.id_etiqueta = ep.id_etiqueta
       WHERE ep.expediente = $1
       ORDER BY et.tipo, et.titulo`,
      [exp(req)]
    );
    res.json(rows);
  })
);

router.put(
  '/preferencias',
  ah(async (req, res) => {
    const ids = [...new Set(req.body?.etiqueta_ids ?? [])]
      .map(Number)
      .filter(Number.isInteger);
    if (ids.length) {
      const ph = ids.map((_, i) => `$${i + 1}`).join(',');
      const validas = await pool.query(
        `SELECT count(*)::int AS n FROM etiqueta
         WHERE id_etiqueta IN (${ph}) AND activa`,
        ids
      );
      if (validas.rows[0].n !== ids.length)
        return res.status(400).json({
          error: 'Hay etiquetas inválidas o inactivas en la selección',
        });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'DELETE FROM estudiante_preferencia WHERE expediente = $1',
        [exp(req)]
      );
      for (const id of ids) {
        await client.query(
          `INSERT INTO estudiante_preferencia (expediente, id_etiqueta)
           VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [exp(req), id]
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

router.get(
  '/notificaciones',
  ah(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT n.id_notificacion, n.titulo, n.mensaje, n.leida,
              n.fecha_creacion, o.titulo AS oferta, o.id_oferta
       FROM notificacion n
       INNER JOIN oferta o ON n.id_oferta = o.id_oferta
       WHERE n.expediente = $1
       ORDER BY n.fecha_creacion DESC, n.id_notificacion DESC`,
      [exp(req)]
    );
    res.json(rows);
  })
);

router.patch(
  '/notificaciones/:id/leida',
  ah(async (req, res) => {
    const { rows } = await pool.query(
      `UPDATE notificacion SET leida = true
       WHERE id_notificacion = $1 AND expediente = $2
       RETURNING *`,
      [req.params.id, exp(req)]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json(rows[0]);
  })
);

// Ofertas que coinciden con las preferencias del estudiante
router.get(
  '/ofertas-recomendadas',
  ah(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT o.id_oferta, o.titulo, o.descripcion, o.modalidad, o.ubicacion,
              o.servicio_social, o.cupo, o.fecha_comienzo, o.fecha_fin,
              e.nombre AS empresa,
              count(*)::int AS coincidencias,
              array_agg(et.titulo ORDER BY et.titulo) AS etiquetas_coincidentes
       FROM oferta o
       INNER JOIN empresa e ON o.id_empresa = e.id_empresa
       INNER JOIN oferta_etiqueta oe ON oe.id_oferta = o.id_oferta
       INNER JOIN estudiante_preferencia ep
               ON ep.id_etiqueta = oe.id_etiqueta AND ep.expediente = $1
       INNER JOIN etiqueta et ON et.id_etiqueta = oe.id_etiqueta
       WHERE o.cupo > 0
       GROUP BY o.id_oferta, o.titulo, o.descripcion, o.modalidad, o.ubicacion,
                o.servicio_social, o.cupo, o.fecha_comienzo, o.fecha_fin, e.nombre
       ORDER BY coincidencias DESC, o.fecha_comienzo ASC NULLS LAST`,
      [exp(req)]
    );
    res.json(rows);
  })
);

export default router;
