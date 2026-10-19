import { Router } from 'express';
import { pool } from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { ah } from '../utils.js';

// Consultas tal como aparecen en machado_flor_baseDatos.sql
const CONSULTAS = {
  // CONSULTA 1: ofertas disponibles con su empresa
  'ofertas-disponibles': `
    SELECT
        o.id_oferta,
        o.titulo,
        e.nombre AS empresa,
        o.modalidad,
        o.ubicacion,
        o.cupo,
        o.fecha_comienzo
    FROM oferta o
    INNER JOIN empresa e
        ON o.id_empresa = e.id_empresa
    WHERE o.cupo > 0
    ORDER BY o.fecha_comienzo ASC`,

  // CONSULTA 2: estudiantes y su información académica
  estudiantes: `
    SELECT
        es.expediente,
        u.nombre,
        u.correo,
        es.carrera,
        es.semestre,
        es.estado,
        es.v_servicio
    FROM estudiante es
    INNER JOIN usuario u
        ON es.id_usuario = u.id_usuario
    ORDER BY es.semestre DESC, u.nombre ASC`,

  // CONSULTA 3: empresas y sus contactos
  'empresas-contactos': `
    SELECT
        e.nombre AS empresa,
        e.giro,
        c.nombre AS contacto,
        c.correo,
        c.telefono,
        c.puesto
    FROM empresa e
    INNER JOIN contacto c
        ON e.id_empresa = c.id_empresa
    ORDER BY e.nombre ASC`,

  // CONSULTA 4: preferencias de cada estudiante
  preferencias: `
    SELECT
        es.expediente,
        u.nombre AS estudiante,
        et.titulo AS preferencia,
        et.tipo
    FROM estudiante es
    INNER JOIN usuario u
        ON es.id_usuario = u.id_usuario
    INNER JOIN estudiante_preferencia ep
        ON es.expediente = ep.expediente
    INNER JOIN etiqueta et
        ON ep.id_etiqueta = et.id_etiqueta
    ORDER BY u.nombre, et.tipo, et.titulo`,

  // CONSULTA 5: etiquetas asociadas a cada oferta
  'ofertas-etiquetas': `
    SELECT
        o.titulo AS oferta,
        e.nombre AS empresa,
        et.titulo AS etiqueta,
        et.tipo
    FROM oferta o
    INNER JOIN empresa e
        ON o.id_empresa = e.id_empresa
    INNER JOIN oferta_etiqueta oe
        ON o.id_oferta = oe.id_oferta
    INNER JOIN etiqueta et
        ON oe.id_etiqueta = et.id_etiqueta
    ORDER BY o.titulo, et.tipo`,

  // CONSULTA 7: conteo servicio social vs prácticas profesionales
  'conteo-tipo': `
    SELECT
        CASE
            WHEN servicio_social = true THEN 'Servicio Social'
            ELSE 'Prácticas Profesionales'
        END AS tipo_oferta,
        COUNT(*) AS cantidad
    FROM oferta
    GROUP BY servicio_social
    ORDER BY cantidad DESC`,

  // CONSULTA 8: notificaciones pendientes (no leídas)
  'notificaciones-pendientes': `
    SELECT
        n.id_notificacion,
        u.nombre AS estudiante,
        n.titulo,
        o.titulo AS oferta,
        n.fecha_creacion
    FROM notificacion n
    INNER JOIN estudiante es
        ON n.expediente = es.expediente
    INNER JOIN usuario u
        ON es.id_usuario = u.id_usuario
    INNER JOIN oferta o
        ON n.id_oferta = o.id_oferta
    WHERE n.leida = false
    ORDER BY n.fecha_creacion DESC`,
};

const router = Router();
router.use(requireRole('ADMIN'));

router.get(
  '/',
  (_req, res) => res.json(Object.keys(CONSULTAS))
);

router.get(
  '/:reporte',
  ah(async (req, res) => {
    const sql = CONSULTAS[req.params.reporte];
    if (!sql) return res.status(404).json({ error: 'Reporte no encontrado' });
    const { rows } = await pool.query(sql);
    res.json(rows);
  })
);

export default router;
export { CONSULTAS };
