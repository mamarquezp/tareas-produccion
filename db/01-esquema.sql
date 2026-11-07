CREATE TABLE equipos (
  slug   text PRIMARY KEY,
  nombre text NOT NULL
);

CREATE TABLE tareas (
  id          bigserial PRIMARY KEY,
  equipo      text NOT NULL REFERENCES equipos (slug),
  titulo      text NOT NULL,
  detalle     text NOT NULL DEFAULT '',
  hecha       boolean NOT NULL DEFAULT false,
  creado_en   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tareas_equipo_idx ON tareas (equipo);

-- La tabla que nadie debería poder leer desde una ruta pública.
CREATE TABLE secretos (
  clave text PRIMARY KEY,
  valor text NOT NULL
);

CREATE TABLE gasto_ia (
  id        bigserial PRIMARY KEY,
  equipo    text NOT NULL,
  centavos  integer NOT NULL,
  cuando    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO equipos (slug, nombre) VALUES
  ('cafe-luna',  'Café Luna'),
  ('taller-sur', 'Taller Sur'),
  ('nube-roja',  'Nube Roja');

INSERT INTO tareas (equipo, titulo, detalle, hecha) VALUES
  ('cafe-luna',  'Cambiar el menú de noviembre', 'Sin nada confidencial.', false),
  ('cafe-luna',  'Pedir vasos', 'Al proveedor de siempre.', true),
  ('cafe-luna',  'Revisar la caja del sábado', 'Cuadró.', true),
  ('taller-sur', 'Rotación de llantas del jueves', 'Cliente habitual.', false),
  ('taller-sur', 'Cotizar compresor', 'Tres proveedores.', false),
  -- La tarea 6 es de Taller Sur y NO la debería ver Café Luna.
  ('taller-sur', 'Renegociar el alquiler del local',
   'Techo de Q18,500 mensuales. No mencionar que ya firmamos con otro. USPG{IDOR-TAREA-AJENA}', false),
  ('nube-roja',  'Migrar el DNS', 'Ventana del domingo.', false),
  ('nube-roja',  'Subir el límite de la tarjeta', 'Para la factura de la nube.', false);

INSERT INTO secretos (clave, valor) VALUES
  ('bandera_sql',       'USPG{INYECCION-TABLA-SECRETOS}'),
  ('llave_pasarela',    'sk_live_no_deberias_estar_viendo_esto'),
  ('correo_soporte',    'soporte@tareas.gt');
