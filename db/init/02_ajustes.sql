/*
Ajustes sobre el esquema original (db/init/01).

- Agrega las llaves primarias que faltaban (notificacion y las tablas puente).
- Quita el UNIQUE de notificacion.titulo para poder reutilizar titulos.
- Re-crea las llaves foraneas con ON DELETE CASCADE para que el CRUD
  pueda eliminar registros sin dejar huerfanos.
- Convierte las contrasenas de ejemplo a hash bcrypt (pgcrypto). Las
  credenciales siguen siendo las mismas (admin123, password123, ...).
*/

-- Llaves primarias faltantes
ALTER TABLE notificacion
    ADD PRIMARY KEY (id_notificacion);

ALTER TABLE estudiante_preferencia
    ADD PRIMARY KEY (expediente, id_etiqueta);

ALTER TABLE oferta_etiqueta
    ADD PRIMARY KEY (id_oferta, id_etiqueta);

-- El titulo de la notificacion no debe ser unico en la practica
ALTER TABLE notificacion
    DROP CONSTRAINT IF EXISTS notificacion_titulo_key;

-- ON DELETE CASCADE
ALTER TABLE contacto DROP CONSTRAINT IF EXISTS contacto_id_empresa_fkey;
ALTER TABLE contacto ADD CONSTRAINT contacto_id_empresa_fkey
    FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa)
    ON DELETE CASCADE;

ALTER TABLE oferta DROP CONSTRAINT IF EXISTS oferta_id_empresa_fkey;
ALTER TABLE oferta ADD CONSTRAINT oferta_id_empresa_fkey
    FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa)
    ON DELETE CASCADE;

ALTER TABLE notificacion DROP CONSTRAINT IF EXISTS notificacion_expediente_fkey;
ALTER TABLE notificacion ADD CONSTRAINT notificacion_expediente_fkey
    FOREIGN KEY (expediente) REFERENCES estudiante(expediente)
    ON DELETE CASCADE;

ALTER TABLE notificacion DROP CONSTRAINT IF EXISTS notificacion_id_oferta_fkey;
ALTER TABLE notificacion ADD CONSTRAINT notificacion_id_oferta_fkey
    FOREIGN KEY (id_oferta) REFERENCES oferta(id_oferta)
    ON DELETE CASCADE;

ALTER TABLE estudiante_preferencia DROP CONSTRAINT IF EXISTS estudiante_preferencia_expediente_fkey;
ALTER TABLE estudiante_preferencia ADD CONSTRAINT estudiante_preferencia_expediente_fkey
    FOREIGN KEY (expediente) REFERENCES estudiante(expediente)
    ON DELETE CASCADE;

ALTER TABLE estudiante_preferencia DROP CONSTRAINT IF EXISTS estudiante_preferencia_id_etiqueta_fkey;
ALTER TABLE estudiante_preferencia ADD CONSTRAINT estudiante_preferencia_id_etiqueta_fkey
    FOREIGN KEY (id_etiqueta) REFERENCES etiqueta(id_etiqueta)
    ON DELETE CASCADE;

ALTER TABLE oferta_etiqueta DROP CONSTRAINT IF EXISTS oferta_etiqueta_id_oferta_fkey;
ALTER TABLE oferta_etiqueta ADD CONSTRAINT oferta_etiqueta_id_oferta_fkey
    FOREIGN KEY (id_oferta) REFERENCES oferta(id_oferta)
    ON DELETE CASCADE;

ALTER TABLE oferta_etiqueta DROP CONSTRAINT IF EXISTS oferta_etiqueta_id_etiqueta_fkey;
ALTER TABLE oferta_etiqueta ADD CONSTRAINT oferta_etiqueta_id_etiqueta_fkey
    FOREIGN KEY (id_etiqueta) REFERENCES etiqueta(id_etiqueta)
    ON DELETE CASCADE;

-- Contrasenas de ejemplo -> hash bcrypt (compatible con bcryptjs)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE usuario
SET password = crypt(password, gen_salt('bf'))
WHERE password NOT LIKE '$2%';
