# Sistema de Prácticas Profesionales y Servicio Social

App web que resuelve las necesidades del documento `machado_flor_baseDatos.sql`:

1. Consultar ofertas de prácticas y servicio social (empresa, modalidad, ubicación).
2. Conocer estudiantes registrados (estado, carrera, semestre).
3. Identificar empresas registradas y sus contactos.
4. Consultar preferencias de cada estudiante (etiquetas HABILIDAD/AMBITO).
5. Identificar etiquetas asociadas a cada oferta.

Además: CRUD completo, login por rol (ADMIN / ESTUDIANTE), notificaciones,
ofertas recomendadas según preferencias y los reportes (consultas 1–5, 7 y 8).

## Stack

- **BD:** PostgreSQL 16 en Docker (`docker-compose.yml`) + Adminer.
- **API:** Node + Express (`server/`), JWT + bcrypt, `pg`.
- **Web:** React + Vite + Bootstrap (`client/`).

## Requisitos

- Docker Desktop (para la base de datos)
- Node.js 18+

## Puesta en marcha

```bash
npm install                 # instala 'concurrently' en la raíz
npm run install:all         # instala deps de server/ y client/
cp server/.env.example server/.env
npm run db                  # levanta Postgres + Adminer (carga db/init/*.sql)
npm run dev                 # API en :3000 y web en :5173
```

- Web: http://localhost:5173
- Adminer: http://localhost:8081 (server `db`, user/pass `practicas`, db `practicas`)
- Resetear la BD con los datos de ejemplo: `npm run db:reset`

## Credenciales de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Admin | `admin@unison.mx` | `admin123` |
| Estudiante | `ana.lopez@unison.mx` | `password123` |
| Estudiante | `carlos.martinez@unison.mx` | `password456` |

(El resto de usuarios sigue el archivo `machado_flor_baseDatos.sql`.)

## Notas sobre el esquema

- `db/init/01_schema_y_datos.sql` es fiel al documento original.
- `db/init/02_ajustes.sql` agrega: PKs que faltaban (`notificacion`, tablas
  puente), `ON DELETE CASCADE`, quita el `UNIQUE` de `notificacion.titulo`
  y hashea las contraseñas de ejemplo con bcrypt (pgcrypto).
- Los reportes usan las consultas del documento tal cual
  (`server/src/routes/reportes.js`).

## Verificación sin Docker

```bash
npm --prefix server run smoke   # valida el SQL con pg-mem y los reportes
npm run build                   # build del cliente
```
