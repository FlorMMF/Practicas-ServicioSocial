import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { requireAuth } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import ofertasRouter from './routes/ofertas.js';
import empresasRouter from './routes/empresas.js';
import contactosRouter from './routes/contactos.js';
import estudiantesRouter from './routes/estudiantes.js';
import etiquetasRouter from './routes/etiquetas.js';
import notificacionesRouter from './routes/notificaciones.js';
import meRouter from './routes/me.js';
import reportesRouter from './routes/reportes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: 'Sin conexión a la base de datos' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/ofertas', requireAuth, ofertasRouter);
app.use('/api/empresas', requireAuth, empresasRouter);
app.use('/api/contactos', requireAuth, contactosRouter);
app.use('/api/estudiantes', requireAuth, estudiantesRouter);
app.use('/api/etiquetas', requireAuth, etiquetasRouter);
app.use('/api/notificaciones', requireAuth, notificacionesRouter);
app.use('/api/me', requireAuth, meRouter);
app.use('/api/reportes', requireAuth, reportesRouter);

const PG_STATUS = {
  '23505': [409, 'Valor duplicado: ya existe un registro con esos datos'],
  '23503': [409, 'Referencia inválida: el registro relacionado no existe o está en uso'],
  '23502': [400, 'Falta un campo obligatorio'],
  '23514': [400, 'El valor no cumple una restricción de la base de datos'],
  '22001': [400, 'Un valor excede la longitud permitida'],
};

app.use((err, _req, res, _next) => {
  const [status, message] = PG_STATUS[err.code] ?? [500, 'Error interno del servidor'];
  if (status === 500) console.error(err);
  res.status(status).json({ error: message, detalle: err.detail });
});

export default app;
