
/*
Necesidades que queremos resolver
--------------------------
1. Consultar las ofertas de prácticas profesionales y servicio social
   disponibles, incluyendo la empresa, modalidad y ubicación.
2. Conocer qué estudiantes están registrados y cuál es su estado académico,
   carrera y semestre.
3. Identificar las empresas registradas y sus datos de contacto.
4. Consultar las preferencias de cada estudiante mediante las etiquetas
   de habilidades y ámbitos de interés.
5. Identificar qué etiquetas o características están asociadas a cada oferta.
*/



CREATE TABLE usuario(
	id_usuario serial PRIMARY KEY,
	nombre VARCHAR(100) NOT NULL,
	correo VARCHAR(100) NOT NULL UNIQUE, 
	password VARCHAR(200) NOT NULL, 
	fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE estudiante(
	expediente INT PRIMARY KEY, 
	id_usuario INT NOT NULL UNIQUE, 
	v_servicio boolean NOT NULL DEFAULT false,
	fecha_v_servicio DATE, 
	estado VARCHAR(20) NOT NULL,
	carrera VARCHAR(150) NOT NULL,
	semestre INT NOT NULL,

	FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE administrador (
    id_admin serial PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    rol VARCHAR(50) NOT NULL,
	
	FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE etiqueta(
	id_etiqueta serial NOT NULL PRIMARY KEY,
	titulo VARCHAR(100) NOT NULL UNIQUE, 
	descripcion VARCHAR(500) NOT NULL, 
	tipo VARCHAR(50) NOT NULL,
	activa boolean NOT NULL,
	fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
	
    CONSTRAINT chk_tipo_etiqueta
        CHECK (tipo IN ('HABILIDAD','AMBITO'))
);

CREATE TABLE empresa(
	id_empresa serial NOT NULL PRIMARY KEY,
	nombre VARCHAR(100) NOT NULL,
	rfc VARCHAR(20) NOT NULL UNIQUE,
	giro VARCHAR(100),
	estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA' 
);

CREATE TABLE oferta(
	id_oferta serial NOT NULL PRIMARY KEY, 
	id_empresa INT NOT NULL,
	titulo VARCHAR(100) NOT NULL, 
	descripcion VARCHAR(500) NOT NULL,
	modalidad VARCHAR(50),
	ubicacion VARCHAR(150),
	servicio_social boolean NOT NULL,
	cupo INT NOT NULL,
	fecha_comienzo DATE, 
	fecha_fin DATE,
	fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
	

	FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa)
);

CREATE TABLE contacto(
	id_contacto serial NOT NULL PRIMARY KEY,
	id_empresa INT NOT NULL,
	nombre VARCHAR(100) NOT NULL,
	correo VARCHAR(100),
	telefono VARCHAR(30),
	puesto VARCHAR(150),
	fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
	
	FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa)

);

CREATE TABLE notificacion(
	id_notificacion serial NOT NULL,
	expediente INT NOT NULL,
	id_oferta INT NOT NULL, 
	titulo VARCHAR(100) NOT NULL UNIQUE, 
	mensaje VARCHAR(500) NOT NULL, 
	leida boolean NOT NULL DEFAULT false,
	fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,

	FOREIGN KEY (expediente) REFERENCES estudiante(expediente),
	FOREIGN KEY (id_oferta) REFERENCES oferta(id_oferta)
);

CREATE TABLE estudiante_preferencia(
	expediente INT NOT NULL,
	id_etiqueta INT NOT NULL, 

	FOREIGN KEY (expediente) REFERENCES estudiante(expediente),
	FOREIGN KEY (id_etiqueta) REFERENCES etiqueta(id_etiqueta)
);

CREATE TABLE oferta_etiqueta(
	id_oferta INT NOT NULL,
	id_etiqueta INT NOT NULL, 

	FOREIGN KEY (id_oferta) REFERENCES oferta(id_oferta),
	FOREIGN KEY (id_etiqueta) REFERENCES etiqueta(id_etiqueta)
);


/* 


VALORES PARA PRUEBAS 


*/

INSERT INTO usuario (nombre, correo, password, fecha_creacion)
VALUES
('Ana López García', 'ana.lopez@unison.mx', 'password123', '2026-01-10'),
('Carlos Martínez Ruiz', 'carlos.martinez@unison.mx', 'password456', '2026-01-12'),
('María Fernanda Torres', 'maria.torres@unison.mx', 'password789', '2026-01-15'),
('José Hernández Díaz', 'jose.hernandez@unison.mx', 'password321', '2026-01-20'),
('Laura Sánchez Pérez', 'laura.sanchez@unison.mx', 'password654', '2026-02-01'),
('Roberto Gómez Silva', 'roberto.gomez@unison.mx', 'password987', '2026-02-05'),
('Sofía Ramírez Flores', 'sofia.ramirez@unison.mx', 'password111', '2026-02-10'),
('Administrador Sistema', 'admin@unison.mx', 'admin123', '2026-01-01');

INSERT INTO estudiante
(expediente, id_usuario, v_servicio, fecha_v_servicio, estado, carrera, semestre)
VALUES
(22010001, 1, true, '2026-03-01', 'ACTIVO',
 'Licenciatura en Ciencias de la Computación', 7),

(22010002, 2, false, NULL, 'ACTIVO',
 'Licenciatura en Ciencias de la Computación', 6),

(22010003, 3, true, '2026-02-15', 'ACTIVO',
 'Ingeniería en Sistemas de Información', 8),

(22010004, 4, false, NULL, 'ACTIVO',
 'Licenciatura en Ciencias de la Computación', 5),

(22010005, 5, false, NULL, 'EGRESADO',
 'Ingeniería en Sistemas de Información', 9),

(22010006, 6, true, '2026-04-10', 'ACTIVO',
 'Licenciatura en Ciencias de la Computación', 7),

(22010007, 7, false, NULL, 'ACTIVO',
 'Ingeniería en Sistemas de Información', 6);

 INSERT INTO administrador (id_usuario, rol)
VALUES
(8, 'ADMINISTRADOR GENERAL');

INSERT INTO etiqueta
(titulo, descripcion, tipo, activa, fecha_creacion)
VALUES
('Python',
 'Programación y desarrollo de aplicaciones utilizando Python.',
 'HABILIDAD', true, '2026-01-05'),

('Java',
 'Programación orientada a objetos utilizando Java.',
 'HABILIDAD', true, '2026-01-05'),

('Inteligencia Artificial',
 'Desarrollo y aplicación de técnicas de inteligencia artificial.',
 'HABILIDAD', true, '2026-01-06'),

('Bases de Datos',
 'Diseño, administración y consulta de bases de datos.',
 'HABILIDAD', true, '2026-01-06'),

('Desarrollo Web',
 'Desarrollo de aplicaciones y sitios web.',
 'HABILIDAD', true, '2026-01-07'),

('Ciencia de Datos',
 'Análisis y procesamiento de datos para obtener información.',
 'HABILIDAD', true, '2026-01-07'),

('Salud',
 'Aplicación de tecnología en el sector salud.',
 'AMBITO', true, '2026-01-08'),

('Educación',
 'Aplicación de tecnología en el ámbito educativo.',
 'AMBITO', true, '2026-01-08'),

('Finanzas',
 'Aplicación de tecnología en el sector financiero.',
 'AMBITO', true, '2026-01-09'),

('Medio Ambiente',
 'Tecnología aplicada al monitoreo y cuidado ambiental.',
 'AMBITO', true, '2026-01-09'),

('Videojuegos',
 'Desarrollo y diseño de videojuegos.',
 'AMBITO', false, '2026-01-10');

INSERT INTO empresa
(nombre, rfc, giro, estado)
VALUES
('Tecnologías del Desierto', 'TDE260101AB1',
 'Desarrollo de Software', 'ACTIVA'),

('Sonora Digital Solutions', 'SDS260202CD2',
 'Tecnologías de Información', 'ACTIVA'),

('Hospital San José', 'HSJ260303EF3',
 'Servicios de Salud', 'ACTIVA'),

('Financiera del Noroeste', 'FDN260404GH4',
 'Servicios Financieros', 'ACTIVA'),

('EcoTech Sonora', 'ETS260505IJ5',
 'Tecnología Ambiental', 'ACTIVA'),

('Innovación Educativa MX', 'IEM260606KL6',
 'Tecnología Educativa', 'INACTIVA');

 INSERT INTO oferta
(id_empresa, titulo, descripcion, modalidad, ubicacion, servicio_social,
 cupo, fecha_comienzo, fecha_fin, fecha_creacion)
VALUES

(1,
 'Desarrollo de aplicaciones con Python',
 'Desarrollo y mantenimiento de aplicaciones internas utilizando Python.',
 'HÍBRIDA',
 'Hermosillo, Sonora',
 false,
 3,
 '2026-08-01',
 '2026-12-15',
 '2026-06-01'),

(1,
 'Prácticas en Inteligencia Artificial',
 'Desarrollo de modelos de aprendizaje automático para problemas empresariales.',
 'PRESENCIAL',
 'Hermosillo, Sonora',
 false,
 2,
 '2026-08-15',
 '2026-12-15',
 '2026-06-05'),

(2,
 'Desarrollo Web Full Stack',
 'Participación en el desarrollo de aplicaciones web empresariales.',
 'REMOTA',
 'México',
 false,
 4,
 '2026-08-01',
 '2026-12-15',
 '2026-06-10'),

(2,
 'Servicio social en bases de datos',
 'Apoyo en organización y mantenimiento de bases de datos.',
 'HÍBRIDA',
 'Hermosillo, Sonora',
 true,
 5,
 '2026-08-01',
 '2026-12-15',
 '2026-06-11'),

(3,
 'Tecnología aplicada a la salud',
 'Desarrollo de herramientas digitales para apoyar procesos hospitalarios.',
 'PRESENCIAL',
 'Hermosillo, Sonora',
 true,
 2,
 '2026-09-01',
 '2027-01-30',
 '2026-06-15'),

(4,
 'Análisis de datos financieros',
 'Análisis y procesamiento de información financiera.',
 'HÍBRIDA',
 'Hermosillo, Sonora',
 false,
 2,
 '2026-08-15',
 '2026-12-15',
 '2026-06-20'),

(5,
 'Monitoreo ambiental con sensores',
 'Desarrollo de sistemas para recopilar y analizar información ambiental.',
 'PRESENCIAL',
 'Hermosillo, Sonora',
 true,
 3,
 '2026-09-01',
 '2027-01-30',
 '2026-06-25');

 INSERT INTO contacto
(id_empresa, nombre, correo, telefono, puesto, fecha_registro)
VALUES
(1, 'Daniel Ortega', 'daniel.ortega@tdesierto.mx',
 '6621001001', 'Gerente de Desarrollo', '2026-05-01'),

(1, 'Patricia Molina', 'patricia.molina@tdesierto.mx',
 '6621001002', 'Recursos Humanos', '2026-05-02'),

(2, 'Luis Ramírez', 'luis.ramirez@sds.mx',
 '6622002001', 'Líder de Desarrollo', '2026-05-03'),

(3, 'Gabriela Navarro', 'gabriela.navarro@hsj.mx',
 '6623003001', 'Coordinadora de Tecnología', '2026-05-04'),

(4, 'Miguel Castillo', 'miguel.castillo@finoro.mx',
 '6624004001', 'Analista Senior', '2026-05-05'),

(5, 'Elena Duarte', 'elena.duarte@ecotech.mx',
 '6625005001', 'Coordinadora de Proyectos', '2026-05-06');

 INSERT INTO estudiante_preferencia (expediente, id_etiqueta)
VALUES
(22010001, 1),
(22010001, 3),
(22010001, 6),
(22010001, 7),

(22010002, 1),
(22010002, 4),
(22010002, 5),

(22010003, 2),
(22010003, 3),
(22010003, 7),

(22010004, 5),
(22010004, 8),

(22010006, 3),
(22010006, 6),
(22010006, 10);


/* ---------------------------------------------------------------------------
   ETIQUETAS DE OFERTAS
   --------------------------------------------------------------------------- */

INSERT INTO oferta_etiqueta (id_oferta, id_etiqueta)
VALUES
(1, 1),
(1, 4),

(2, 1),
(2, 3),
(2, 6),

(3, 5),
(3, 4),

(4, 4),

(5, 3),
(5, 7),

(6, 6),
(6, 9),

(7, 1),
(7, 6),
(7, 10);


INSERT INTO notificacion
(expediente, id_oferta, titulo, mensaje, leida, fecha_creacion)
VALUES
(22010001, 2,
 'Nueva oferta de Inteligencia Artificial',
 'Se encontró una oferta relacionada con tus preferencias.',
 true,
 '2026-06-10'),

(22010001, 5,
 'Oferta en sector salud',
 'Existe una oportunidad de servicio social relacionada con salud.',
 false,
 '2026-06-15'),

(22010002, 1,
 'Oferta de Python disponible',
 'Una nueva oferta relacionada con Python está disponible.',
 true,
 '2026-06-12'),

(22010003, 5,
 'Servicio social en salud',
 'Hay una oferta que coincide con tus intereses.',
 false,
 '2026-06-18'),

(22010004, 3,
 'Oferta de desarrollo web',
 'Se publicó una nueva oferta de desarrollo web.',
 false,
 '2026-06-20'),

(22010006, 7,
 'Proyecto de monitoreo ambiental',
 'Se publicó una oportunidad relacionada con medio ambiente.',
 true,
 '2026-06-25');

/*


Consultas


*/

 
/*
 CONSULTA 1
----------
Necesidad: consultar todas las ofertas disponibles.

Resultado esperado: Mostrar las ofertas junto con la empresa que las publicó.

*/

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
ORDER BY o.fecha_comienzo ASC;

/*
CONSULTA 2
----------
Necesidad: identificar estudiantes registrados y conocer su información
académica.

Resultado esperado: Ordena los estudiantes por semestre.
*/

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
ORDER BY es.semestre DESC, u.nombre ASC;

/*
CONSULTA 3
----------
Necesidad: consultar las empresas y sus contactos.

Resultado esperado: Ordena la información del contacto
*/

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
ORDER BY e.nombre ASC;


/*
CONSULTA 4
----------
Necesidad: conocer las preferencias de cada estudiante.

Resultado esperado: Combina estudiante, usuario y etiquetas.
*/

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
ORDER BY u.nombre, et.tipo, et.titulo;


/*
CONSULTA 5
----------
Necesidad: identificar las características asociadas a cada oferta.
Resultado esperado: ordena las ofertas con su información 
*/

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
ORDER BY o.titulo, et.tipo;



/*
CONSULTA 7
----------
Necesidad: conocer cuántas ofertas existen de servicio social y cuántas
corresponden a prácticas profesionales.
Resultado esperado: cantidad de ss y pp
*/

SELECT
    CASE
        WHEN servicio_social = true THEN 'Servicio Social'
        ELSE 'Prácticas Profesionales'
    END AS tipo_oferta,
    COUNT(*) AS cantidad
FROM oferta
GROUP BY servicio_social
ORDER BY cantidad DESC;


/*
CONSULTA 8
----------
Necesidad: consultar las notificaciones pendientes de los estudiantes.

Resultado esperado:Muestra solamente las notificaciones que todavía no han sido leídas.
*/

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
ORDER BY n.fecha_creacion DESC;


/*


 PRUEBAS DE INTEGRIDAD

 
*/


/*


Se intenta insertar un estudiante utilizando un expediente que ya existe.

INSERT INTO estudiante
(expediente, id_usuario, v_servicio, estado, carrera, semestre)
VALUES
(22010001, 2, false, 'ACTIVO',
 'Licenciatura en Ciencias de la Computación', 6);
*/


/*

Se intenta crear una oferta asociada a una empresa que no existe.

El id_empresa 999 no está registrado en la tabla empresa.

INSERT INTO oferta
(id_empresa, titulo, descripcion, modalidad, ubicacion,
 servicio_social, cupo)
VALUES
(999,
 'Oferta inválida',
 'Esta oferta debe ser rechazada.',
 'REMOTA',
 'Hermosillo',
 false,
 1);
*/


/*


Se intenta insertar un usuario sin nombre.

La columna nombre está definida como NOT NULL.


INSERT INTO usuario
(nombre, correo, password)
VALUES
(NULL, 'usuario.invalido@unison.mx', 'password123');
*/




