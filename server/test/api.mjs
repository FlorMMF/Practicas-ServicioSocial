/*
Prueba end-to-end de la API usando pg-mem (sin Docker).
Uso: node test/api.mjs   (desde server/)
*/
process.env.PG_MEM = '1';
const { default: app } = await import('../src/app.js');

const srv = app.listen(0);
await new Promise((r) => srv.once('listening', r));
const base = `http://localhost:${srv.address().port}/api`;

let fallos = 0;
const check = (nombre, cond) => {
  console.log(`${cond ? 'OK  ' : 'FALLO'} ${nombre}`);
  if (!cond) fallos++;
};

async function f(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

// health
check('health', (await f('/health')).data?.ok === true);

// login admin y estudiante
const loginAdmin = await f('/auth/login', {
  method: 'POST',
  body: { correo: 'admin@unison.mx', password: 'admin123' },
});
check('login admin', loginAdmin.status === 200 && loginAdmin.data.user.rol === 'ADMIN');
const adminT = loginAdmin.data?.token;

const loginEst = await f('/auth/login', {
  method: 'POST',
  body: { correo: 'ana.lopez@unison.mx', password: 'password123' },
});
check(
  'login estudiante',
  loginEst.status === 200 &&
    loginEst.data.user.rol === 'ESTUDIANTE' &&
    loginEst.data.user.expediente === 22010001
);
const estT = loginEst.data?.token;

check(
  'login incorrecto → 401',
  (await f('/auth/login', { method: 'POST', body: { correo: 'admin@unison.mx', password: 'x' } })).status === 401
);
check('sin token → 401', (await f('/ofertas')).status === 401);

// roles
check(
  'estudiante no accede a reportes (403)',
  (await f('/reportes/estudiantes', { token: estT })).status === 403
);
check(
  'admin sí accede a reportes',
  (await f('/reportes/estudiantes', { token: adminT })).data?.length === 7
);

// ofertas
const ofertas = await f('/ofertas', { token: estT });
check('ofertas: 7 con etiquetas', ofertas.data?.length === 7 && Array.isArray(ofertas.data[0].etiquetas));
check(
  'ofertas filtro servicio_social=true → 3',
  (await f('/ofertas?servicio_social=true', { token: estT })).data?.length === 3
);
check(
  'ofertas filtro modalidad=REMOTA → 1',
  (await f('/ofertas?modalidad=REMOTA', { token: estT })).data?.length === 1
);
check(
  'ofertas filtro etiqueta=4 → 3',
  (await f('/ofertas?etiqueta=4', { token: estT })).data?.length === 3
);

// CRUD oferta (admin)
const nueva = await f('/ofertas', {
  method: 'POST',
  token: adminT,
  body: {
    id_empresa: 2,
    titulo: 'Oferta de prueba',
    descripcion: 'Creada por el test.',
    modalidad: 'REMOTA',
    servicio_social: false,
    cupo: 2,
    etiqueta_ids: [1, 5],
  },
});
check('crear oferta', nueva.status === 201);
const nuevaId = nueva.data?.id_oferta;
const nuevaDet = await f(`/ofertas/${nuevaId}`, { token: adminT });
check('oferta creada con 2 etiquetas', nuevaDet.data?.etiquetas?.length === 2);

check(
  'editar oferta (cupo)',
  (await f(`/ofertas/${nuevaId}`, {
    method: 'PUT',
    token: adminT,
    body: { ...nueva.data, cupo: 9, etiqueta_ids: [1] },
  })).data?.cupo === 9
);
check(
  'borrar oferta',
  (await f(`/ofertas/${nuevaId}`, { method: 'DELETE', token: adminT })).data?.ok === true
);

// integridad: empresa inexistente → rechazada por FK
// (en Postgres real es 409; pg-mem no propaga el código de error)
check(
  'oferta con empresa inexistente rechazada',
  (await f('/ofertas', {
    method: 'POST',
    token: adminT,
    body: { id_empresa: 999, titulo: 'x', descripcion: 'x', cupo: 1 },
  })).status >= 400
);

// estudiante no puede crear ofertas
check(
  'estudiante no crea ofertas (403)',
  (await f('/ofertas', {
    method: 'POST',
    token: estT,
    body: { id_empresa: 1, titulo: 'x', descripcion: 'x', cupo: 1 },
  })).status === 403
);

// preferencias del estudiante
const prefs = await f('/me/preferencias', { token: estT });
check('preferencias iniciales: 4', prefs.data?.length === 4);
check(
  'guardar preferencias',
  (await f('/me/preferencias', { method: 'PUT', token: estT, body: { etiqueta_ids: [1, 4] } })).data?.ok === true
);
check(
  'preferencias rechaza inactivas',
  (await f('/me/preferencias', { method: 'PUT', token: estT, body: { etiqueta_ids: [11] } })).status === 400
);

// ofertas recomendadas
const rec = await f('/me/ofertas-recomendadas', { token: estT });
check(
  'recomendadas: coincidencias correctas',
  rec.data?.length === 5 && rec.data[0].coincidencias === 2
);

// notificaciones del estudiante (exp 22010001 tiene 2: 1 leída, 1 pendiente)
const notifs = await f('/me/notificaciones', { token: estT });
check('notificaciones propias: 2', notifs.data?.length === 2);
const pend = notifs.data.find((n) => !n.leida);
check(
  'marcar leída',
  (await f(`/me/notificaciones/${pend.id_notificacion}/leida`, { method: 'PATCH', token: estT })).data?.leida === true
);
check(
  'notificación ajena → 404',
  (await f('/me/notificaciones/3/leida', { method: 'PATCH', token: estT })).status === 404
);

// CRUD estudiante: crear + duplicado
const nuevoEst = await f('/estudiantes', {
  method: 'POST',
  token: adminT,
  body: {
    nombre: 'Test Estudiante',
    correo: 'test@unison.mx',
    password: 'secreto1',
    expediente: 22010099,
    carrera: 'LCC',
    semestre: 3,
  },
});
check('crear estudiante', nuevoEst.status === 201);
check(
  'expediente duplicado → 409',
  (await f('/estudiantes', {
    method: 'POST',
    token: adminT,
    body: { ...nuevoEst.data, nombre: 'Otro', correo: 'otro@unison.mx', password: 'x', expediente: 22010099, carrera: 'LCC', semestre: 3 },
  })).status === 409
);
check(
  'correo duplicado → 409',
  (await f('/estudiantes', {
    method: 'POST',
    token: adminT,
    body: { nombre: 'Otro', correo: 'test@unison.mx', password: 'x', expediente: 22010100, carrera: 'LCC', semestre: 3 },
  })).status === 409
);
check(
  'login del nuevo estudiante',
  (await f('/auth/login', { method: 'POST', body: { correo: 'test@unison.mx', password: 'secreto1' } })).status === 200
);
check(
  'borrar estudiante',
  (await f('/estudiantes/22010099', { method: 'DELETE', token: adminT })).data?.ok === true
);

// empresas + contactos
check('empresas: 6 con contactos', (await f('/empresas', { token: adminT })).data?.length === 6);
check(
  'borrar empresa 6 (sin ofertas)',
  (await f('/empresas/6', { method: 'DELETE', token: adminT })).data?.ok === true
);

console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo OK');
srv.close();
process.exit(fallos ? 1 : 0);
