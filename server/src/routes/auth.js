import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAuth, JWT_SECRET } from '../middleware/auth.js';
import { ah } from '../utils.js';

const router = Router();

router.post(
  '/login',
  ah(async (req, res) => {
    const { correo, password } = req.body ?? {};
    if (!correo || !password)
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });

    const { rows } = await pool.query(
      'SELECT * FROM usuario WHERE correo = $1',
      [correo]
    );
    const u = rows[0];
    if (!u || !(await bcrypt.compare(password, u.password)))
      return res.status(401).json({ error: 'Credenciales inválidas' });

    let rol = 'USUARIO';
    let expediente = null;
    const admin = await pool.query(
      'SELECT rol FROM administrador WHERE id_usuario = $1',
      [u.id_usuario]
    );
    if (admin.rowCount) {
      rol = 'ADMIN';
    } else {
      const est = await pool.query(
        'SELECT expediente FROM estudiante WHERE id_usuario = $1',
        [u.id_usuario]
      );
      if (est.rowCount) {
        rol = 'ESTUDIANTE';
        expediente = est.rows[0].expediente;
      }
    }

    const payload = {
      id_usuario: u.id_usuario,
      nombre: u.nombre,
      correo: u.correo,
      rol,
      expediente,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: payload });
  })
);

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
