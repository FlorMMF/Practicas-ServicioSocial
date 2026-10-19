import { Router } from 'express';
import { pool } from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { ah } from '../utils.js';

const router = Router();
const ADMIN = requireRole('ADMIN');

router.get(
  '/',
  ah(async (_req, res) => {
    const [empresas, contactos, counts] = await Promise.all([
      pool.query('SELECT * FROM empresa ORDER BY nombre'),
      pool.query('SELECT * FROM contacto ORDER BY nombre'),
      pool.query(
        'SELECT id_empresa, count(*)::int AS n FROM oferta GROUP BY id_empresa'
      ),
    ]);
    res.json(
      empresas.rows.map((e) => ({
        ...e,
        contactos: contactos.rows
          .filter((c) => c.id_empresa === e.id_empresa)
          .map(({ id_contacto: id, ...rest }) => ({ id, ...rest })),
        num_ofertas:
          counts.rows.find((c) => c.id_empresa === e.id_empresa)?.n ?? 0,
      }))
    );
  })
);

router.get(
  '/:id',
  ah(async (req, res) => {
    const emp = await pool.query(
      'SELECT * FROM empresa WHERE id_empresa = $1',
      [req.params.id]
    );
    if (!emp.rowCount)
      return res.status(404).json({ error: 'Empresa no encontrada' });
    const contactos = await pool.query(
      'SELECT * FROM contacto WHERE id_empresa = $1 ORDER BY nombre',
      [req.params.id]
    );
    const ofertas = await pool.query(
      'SELECT id_oferta, titulo, modalidad, cupo FROM oferta WHERE id_empresa = $1 ORDER BY titulo',
      [req.params.id]
    );
    res.json({
      ...emp.rows[0],
      contactos: contactos.rows,
      ofertas: ofertas.rows,
    });
  })
);

router.post(
  '/',
  ADMIN,
  ah(async (req, res) => {
    const { nombre, rfc, giro, estado = 'ACTIVA' } = req.body ?? {};
    if (!nombre || !rfc)
      return res.status(400).json({ error: 'Nombre y RFC son obligatorios' });
    const { rows } = await pool.query(
      'INSERT INTO empresa (nombre, rfc, giro, estado) VALUES ($1,$2,$3,$4) RETURNING *',
      [nombre, rfc, giro || null, estado]
    );
    res.status(201).json(rows[0]);
  })
);

router.put(
  '/:id',
  ADMIN,
  ah(async (req, res) => {
    const { nombre, rfc, giro, estado } = req.body ?? {};
    if (!nombre || !rfc)
      return res.status(400).json({ error: 'Nombre y RFC son obligatorios' });
    const { rows } = await pool.query(
      'UPDATE empresa SET nombre=$1, rfc=$2, giro=$3, estado=$4 WHERE id_empresa=$5 RETURNING *',
      [nombre, rfc, giro || null, estado || 'ACTIVA', req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json(rows[0]);
  })
);

router.delete(
  '/:id',
  ADMIN,
  ah(async (req, res) => {
    const { rowCount } = await pool.query(
      'DELETE FROM empresa WHERE id_empresa = $1',
      [req.params.id]
    );
    if (!rowCount)
      return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json({ ok: true });
  })
);

router.post(
  '/:id/contactos',
  ADMIN,
  ah(async (req, res) => {
    const { nombre, correo, telefono, puesto } = req.body ?? {};
    if (!nombre)
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    const { rows } = await pool.query(
      `INSERT INTO contacto (id_empresa, nombre, correo, telefono, puesto)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, nombre, correo || null, telefono || null, puesto || null]
    );
    res.status(201).json(rows[0]);
  })
);

export default router;
