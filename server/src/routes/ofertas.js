import { Router } from 'express';
import { pool } from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { ah } from '../utils.js';

const router = Router();
const ADMIN = requireRole('ADMIN');

const SELECT_OFERTAS = `
SELECT o.id_oferta, o.id_empresa, o.titulo, o.descripcion, o.modalidad,
       o.ubicacion, o.servicio_social, o.cupo, o.fecha_comienzo, o.fecha_fin,
       o.fecha_creacion,
       e.nombre AS empresa
FROM oferta o
INNER JOIN empresa e ON e.id_empresa = o.id_empresa`;

async function conEtiquetas(rows) {
  if (!rows.length) return rows;
  const ids = rows.map((r) => r.id_oferta);
  const ph = ids.map((_, i) => `$${i + 1}`).join(',');
  const { rows: links } = await pool.query(
    `SELECT oe.id_oferta, et.id_etiqueta AS id, et.titulo, et.tipo
     FROM oferta_etiqueta oe
     INNER JOIN etiqueta et ON et.id_etiqueta = oe.id_etiqueta
     WHERE oe.id_oferta IN (${ph})
     ORDER BY et.tipo, et.titulo`,
    ids
  );
  return rows.map((r) => ({
    ...r,
    etiquetas: links.filter((l) => l.id_oferta === r.id_oferta),
  }));
}

router.get(
  '/',
  ah(async (req, res) => {
    const { servicio_social, modalidad, empresa, etiqueta, q, disponibles } =
      req.query;
    const conds = [];
    const params = [];
    const add = (cond, val) => {
      params.push(val);
      conds.push(cond.replace('?', `$${params.length}`));
    };
    if (disponibles === '1') conds.push('o.cupo > 0');
    if (servicio_social === 'true' || servicio_social === 'false')
      add('o.servicio_social = ?', servicio_social === 'true');
    if (modalidad) add('o.modalidad = ?', modalidad);
    if (empresa) add('o.id_empresa = ?', empresa);
    if (etiqueta)
      add(
        'o.id_oferta IN (SELECT id_oferta FROM oferta_etiqueta WHERE id_etiqueta = ?)',
        etiqueta
      );
    if (q) {
      params.push(`%${q}%`);
      conds.push(
        `(o.titulo ILIKE $${params.length} OR o.descripcion ILIKE $${params.length})`
      );
    }
    const where = conds.length ? ` WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `${SELECT_OFERTAS}${where}
       ORDER BY o.fecha_comienzo ASC NULLS LAST, o.id_oferta`,
      params
    );
    res.json(await conEtiquetas(rows));
  })
);

router.get(
  '/:id',
  ah(async (req, res) => {
    const { rows } = await pool.query(
      `${SELECT_OFERTAS} WHERE o.id_oferta = $1`,
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Oferta no encontrada' });
    res.json((await conEtiquetas(rows))[0]);
  })
);

async function setEtiquetas(client, idOferta, ids) {
  await client.query('DELETE FROM oferta_etiqueta WHERE id_oferta = $1', [
    idOferta,
  ]);
  for (const id of ids ?? []) {
    await client.query(
      'INSERT INTO oferta_etiqueta (id_oferta, id_etiqueta) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [idOferta, id]
    );
  }
}

function validarOferta(body) {
  const faltan = ['id_empresa', 'titulo', 'descripcion', 'cupo'].filter(
    (k) => body[k] === undefined || body[k] === null || body[k] === ''
  );
  return faltan.length ? `Faltan campos: ${faltan.join(', ')}` : null;
}

router.post(
  '/',
  ADMIN,
  ah(async (req, res) => {
    const b = req.body ?? {};
    const msg = validarOferta(b);
    if (msg) return res.status(400).json({ error: msg });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO oferta
         (id_empresa, titulo, descripcion, modalidad, ubicacion,
          servicio_social, cupo, fecha_comienzo, fecha_fin)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          b.id_empresa,
          b.titulo,
          b.descripcion,
          b.modalidad || null,
          b.ubicacion || null,
          !!b.servicio_social,
          b.cupo,
          b.fecha_comienzo || null,
          b.fecha_fin || null,
        ]
      );
      await setEtiquetas(client, rows[0].id_oferta, b.etiqueta_ids);
      await client.query('COMMIT');
      res.status(201).json(rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  })
);

router.put(
  '/:id',
  ADMIN,
  ah(async (req, res) => {
    const b = req.body ?? {};
    const msg = validarOferta(b);
    if (msg) return res.status(400).json({ error: msg });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `UPDATE oferta SET
           id_empresa=$1, titulo=$2, descripcion=$3, modalidad=$4,
           ubicacion=$5, servicio_social=$6, cupo=$7,
           fecha_comienzo=$8, fecha_fin=$9
         WHERE id_oferta=$10 RETURNING *`,
        [
          b.id_empresa,
          b.titulo,
          b.descripcion,
          b.modalidad || null,
          b.ubicacion || null,
          !!b.servicio_social,
          b.cupo,
          b.fecha_comienzo || null,
          b.fecha_fin || null,
          req.params.id,
        ]
      );
      if (!rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Oferta no encontrada' });
      }
      await setEtiquetas(client, req.params.id, b.etiqueta_ids);
      await client.query('COMMIT');
      res.json(rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  })
);

router.delete(
  '/:id',
  ADMIN,
  ah(async (req, res) => {
    const { rowCount } = await pool.query(
      'DELETE FROM oferta WHERE id_oferta = $1',
      [req.params.id]
    );
    if (!rowCount)
      return res.status(404).json({ error: 'Oferta no encontrada' });
    res.json({ ok: true });
  })
);

export default router;
