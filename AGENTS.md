# Notas del proyecto

- `npm run db`: Postgres en Docker (requiere Docker Desktop instalado).
- `npm run dev`: levanta API (:3000) y cliente Vite (:5173) a la vez.
- `npm --prefix server run smoke`: verifica el SQL de `db/init/` con pg-mem.
- `npm run build`: build del cliente.
- Credenciales: `admin@unison.mx / admin123`, `ana.lopez@unison.mx / password123`.
- No modificar `machado_flor_baseDatos.sql` ni `db/init/01` (es la entrega base);
  los cambios al esquema van en `db/init/02_ajustes.sql`.
