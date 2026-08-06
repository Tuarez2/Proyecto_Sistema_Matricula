import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const directorioActual = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directorioActual, '..', '..', '.env') });

import environment from '../config/environment.js';
import {
  ACADEMIC_PERIOD_STATUS,
  ACADEMIC_STATUS,
  COURSE_STATUS,
  ENROLLMENT_STATUS,
  ROLE_CODES
} from '../constants/domain.constants.js';
import {
  Asignatura,
  Carrera,
  CarreraAsignatura,
  Curso,
  Docente,
  Estudiante,
  Facultad,
  Matricula,
  PeriodoAcademico,
  Rol,
  Usuario,
  sequelize
} from '../models/index.js';
import { generarHashPassword } from '../utils/password.js';

const CONTRASENA_DEMO_POR_DEFECTO = 'Demo.2026';
const CONTRASENA_DEMO = process.env.DEMO_USER_PASSWORD || CONTRASENA_DEMO_POR_DEFECTO;

const MILISEGUNDOS_DIA = 24 * 60 * 60 * 1000;
const fechaHoy = new Date();
fechaHoy.setHours(0, 0, 0, 0);

const formatearFecha = (fecha) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const enDias = (cantidadDias) => new Date(fechaHoy.getTime() + cantidadDias * MILISEGUNDOS_DIA);
const haceDias = (cantidadDias) => new Date(Date.now() - cantidadDias * MILISEGUNDOS_DIA);

const FACULTADES = [
  { codigo: 'DEMO-FAC-ING', nombre: 'Facultad de Ingeniería y Tecnología', activo: true },
  { codigo: 'DEMO-FAC-ADM', nombre: 'Facultad de Ciencias Administrativas', activo: true }
];

const CARRERAS = [
  {
    codigo: 'DEMO-CAR-SIS',
    nombre: 'Ingeniería de Software',
    duracion_semestres: 8,
    facultad: 'DEMO-FAC-ING',
    activo: true
  },
  {
    codigo: 'DEMO-CAR-TIN',
    nombre: 'Tecnologías de la Información',
    duracion_semestres: 8,
    facultad: 'DEMO-FAC-ING',
    activo: true
  },
  {
    codigo: 'DEMO-CAR-ADM',
    nombre: 'Administración de Empresas',
    duracion_semestres: 8,
    facultad: 'DEMO-FAC-ADM',
    activo: true
  },
  {
    codigo: 'DEMO-CAR-INACT',
    nombre: 'Carrera Inactiva de Prueba',
    duracion_semestres: 6,
    facultad: 'DEMO-FAC-ADM',
    activo: false
  }
];

const ASIGNATURAS = [
  { codigo: 'ASI-FUNPRO', nombre: 'Fundamentos de Programación', creditos: 4, nivel_academico: 1, activo: true },
  { codigo: 'ASI-MATDIS', nombre: 'Matemática Discreta', creditos: 4, nivel_academico: 1, activo: true },
  { codigo: 'ASI-POO', nombre: 'Programación Orientada a Objetos', creditos: 4, nivel_academico: 2, activo: true },
  { codigo: 'ASI-BD', nombre: 'Base de Datos', creditos: 4, nivel_academico: 2, activo: true },
  { codigo: 'ASI-ESTDAT', nombre: 'Estructuras de Datos', creditos: 4, nivel_academico: 2, activo: true },
  { codigo: 'ASI-DEVWEB', nombre: 'Desarrollo Web', creditos: 4, nivel_academico: 3, activo: true },
  { codigo: 'ASI-REDES', nombre: 'Redes', creditos: 4, nivel_academico: 3, activo: true },
  { codigo: 'ASI-ISW', nombre: 'Ingeniería de Software', creditos: 4, nivel_academico: 4, activo: true },
  { codigo: 'ASI-SISOPER', nombre: 'Sistemas Operativos', creditos: 4, nivel_academico: 3, activo: true },
  { codigo: 'ASI-CIBSEG', nombre: 'Ciberseguridad', creditos: 4, nivel_academico: 4, activo: true },
  { codigo: 'ASI-CONTAB', nombre: 'Contabilidad General', creditos: 4, nivel_academico: 1, activo: true },
  { codigo: 'ASI-GESTION', nombre: 'Gestión Empresarial', creditos: 4, nivel_academico: 2, activo: true },
  { codigo: 'ASI-MARKET', nombre: 'Marketing Digital', creditos: 4, nivel_academico: 3, activo: true },
  { codigo: 'ASI-DEMOINACT', nombre: 'Asignatura Inactiva de Prueba', creditos: 3, nivel_academico: 5, activo: false }
];

const MALLA = [
  [
    'DEMO-CAR-SIS',
    ['ASI-FUNPRO', 'ASI-MATDIS', 'ASI-POO', 'ASI-BD', 'ASI-ESTDAT', 'ASI-DEVWEB', 'ASI-REDES', 'ASI-ISW']
  ],
  ['DEMO-CAR-TIN', ['ASI-FUNPRO', 'ASI-POO', 'ASI-BD', 'ASI-DEVWEB', 'ASI-SISOPER', 'ASI-CIBSEG']],
  ['DEMO-CAR-ADM', ['ASI-CONTAB', 'ASI-GESTION', 'ASI-MARKET']],
  ['DEMO-CAR-INACT', ['ASI-FUNPRO', 'ASI-GESTION']]
];

const DOCENTES = [
  {
    identificacion: 'DEMO-DOC-001',
    nombres: 'María',
    apellidos: 'López Salazar',
    correo: 'demo.docente1@universidad.test',
    telefono: '0999000001',
    especialidad: 'Programación y Software',
    activo: true,
    conUsuario: true
  },
  {
    identificacion: 'DEMO-DOC-002',
    nombres: 'Pedro',
    apellidos: 'Ramírez Paredes',
    correo: 'demo.docente2@universidad.test',
    telefono: '0999000002',
    especialidad: 'Base de Datos',
    activo: true,
    conUsuario: true
  },
  {
    identificacion: 'DEMO-DOC-003',
    nombres: 'Carlos',
    apellidos: 'Sánchez Ortiz',
    correo: 'demo.docente3@universidad.test',
    telefono: '0999000003',
    especialidad: 'Redes',
    activo: false,
    conUsuario: false
  }
];

const PERIODOS = [
  {
    codigo: 'DEMO-PER-ANT',
    nombre: 'Periodo Anterior de Prueba',
    fecha_inicio: formatearFecha(enDias(-200)),
    fecha_fin: formatearFecha(enDias(-15)),
    fecha_inicio_matricula: enDias(-230),
    fecha_fin_matricula: enDias(-215),
    estado: ACADEMIC_PERIOD_STATUS.CLOSED
  },
  {
    codigo: 'DEMO-PER-ACT',
    nombre: 'Periodo Actual de Prueba',
    fecha_inicio: formatearFecha(enDias(20)),
    fecha_fin: formatearFecha(enDias(200)),
    fecha_inicio_matricula: enDias(-7),
    fecha_fin_matricula: enDias(30),
    estado: ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN
  },
  {
    codigo: 'DEMO-PER-PROX',
    nombre: 'Periodo Proximo de Prueba',
    fecha_inicio: formatearFecha(enDias(120)),
    fecha_fin: formatearFecha(enDias(240)),
    fecha_inicio_matricula: enDias(110),
    fecha_fin_matricula: enDias(130),
    estado: ACADEMIC_PERIOD_STATUS.PLANNED
  }
];

const CURSOS = [
  {
    periodo: 'DEMO-PER-ANT',
    asignatura: 'ASI-FUNPRO',
    paralelo: 'A',
    docente: 'DEMO-DOC-001',
    aula: 'A-101',
    horario: 'Lunes 07:00 - 09:00',
    cupo_maximo: 40,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ANT',
    asignatura: 'ASI-POO',
    paralelo: 'A',
    docente: 'DEMO-DOC-001',
    aula: 'A-102',
    horario: 'Miércoles 07:00 - 09:00',
    cupo_maximo: 35,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ANT',
    asignatura: 'ASI-BD',
    paralelo: 'A',
    docente: 'DEMO-DOC-002',
    aula: 'A-103',
    horario: 'Martes 10:00 - 12:00',
    cupo_maximo: 35,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ANT',
    asignatura: 'ASI-MATDIS',
    paralelo: 'A',
    docente: 'DEMO-DOC-001',
    aula: 'A-104',
    horario: 'Jueves 07:00 - 09:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ANT',
    asignatura: 'ASI-DEVWEB',
    paralelo: 'A',
    docente: 'DEMO-DOC-002',
    aula: 'A-105',
    horario: 'Viernes 14:00 - 16:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ANT',
    asignatura: 'ASI-CONTAB',
    paralelo: 'A',
    docente: 'DEMO-DOC-002',
    aula: 'A-106',
    horario: 'Lunes 14:00 - 16:00',
    cupo_maximo: 40,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ACT',
    asignatura: 'ASI-FUNPRO',
    paralelo: 'A',
    docente: 'DEMO-DOC-001',
    aula: 'B-201',
    horario: 'Lunes 07:00 - 09:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ACT',
    asignatura: 'ASI-POO',
    paralelo: 'A',
    docente: 'DEMO-DOC-001',
    aula: 'B-202',
    horario: 'Martes 07:00 - 09:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ACT',
    asignatura: 'ASI-POO',
    paralelo: 'B',
    docente: 'DEMO-DOC-002',
    aula: 'B-203',
    horario: 'Martes 09:00 - 11:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ACT',
    asignatura: 'ASI-BD',
    paralelo: 'A',
    docente: 'DEMO-DOC-002',
    aula: 'B-204',
    horario: 'Miércoles 10:00 - 12:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ACT',
    asignatura: 'ASI-DEVWEB',
    paralelo: 'A',
    docente: 'DEMO-DOC-001',
    aula: 'B-205',
    horario: 'Jueves 14:00 - 16:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ACT',
    asignatura: 'ASI-DEVWEB',
    paralelo: 'B',
    docente: 'DEMO-DOC-002',
    aula: 'B-206',
    horario: 'Jueves 16:00 - 18:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ACT',
    asignatura: 'ASI-REDES',
    paralelo: 'A',
    docente: 'DEMO-DOC-001',
    aula: 'B-207',
    horario: 'Viernes 07:00 - 09:00',
    cupo_maximo: 3,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ACT',
    asignatura: 'ASI-ISW',
    paralelo: 'A',
    docente: 'DEMO-DOC-002',
    aula: 'B-208',
    horario: 'Lunes 16:00 - 18:00',
    cupo_maximo: 2,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ACT',
    asignatura: 'ASI-MATDIS',
    paralelo: 'A',
    docente: 'DEMO-DOC-001',
    aula: 'B-209',
    horario: 'Martes 14:00 - 16:00',
    cupo_maximo: 20,
    estado: COURSE_STATUS.CLOSED
  },
  {
    periodo: 'DEMO-PER-ACT',
    asignatura: 'ASI-ESTDAT',
    paralelo: 'A',
    docente: 'DEMO-DOC-003',
    aula: 'B-210',
    horario: 'Miércoles 07:00 - 09:00',
    cupo_maximo: 20,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ACT',
    asignatura: 'ASI-DEMOINACT',
    paralelo: 'A',
    docente: 'DEMO-DOC-001',
    aula: 'B-211',
    horario: 'Viernes 09:00 - 11:00',
    cupo_maximo: 20,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ACT',
    asignatura: 'ASI-MARKET',
    paralelo: 'A',
    docente: 'DEMO-DOC-002',
    aula: 'B-212',
    horario: 'Lunes 10:00 - 12:00',
    cupo_maximo: 20,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ACT',
    asignatura: 'ASI-CONTAB',
    paralelo: 'A',
    docente: 'DEMO-DOC-002',
    aula: 'B-213',
    horario: 'Martes 10:00 - 12:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-ACT',
    asignatura: 'ASI-GESTION',
    paralelo: 'A',
    docente: 'DEMO-DOC-001',
    aula: 'B-214',
    horario: 'Miércoles 14:00 - 16:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-PROX',
    asignatura: 'ASI-FUNPRO',
    paralelo: 'A',
    docente: 'DEMO-DOC-001',
    aula: 'C-301',
    horario: 'Lunes 07:00 - 09:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: 'DEMO-PER-PROX',
    asignatura: 'ASI-POO',
    paralelo: 'A',
    docente: 'DEMO-DOC-002',
    aula: 'C-302',
    horario: 'Martes 07:00 - 09:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  }
];

const ESTUDIANTES = [
  {
    numero_matricula: 'DEMO-EST-001',
    identificacion: 'DEMO-EST-001',
    nombres: 'Ana',
    apellidos: 'Martínez Gómez',
    correo: 'demo.estudiante1@universidad.test',
    telefono: '0999000001',
    fecha_nacimiento: '2004-05-10',
    estado_academico: ACADEMIC_STATUS.ACTIVE,
    nivel_academico_actual: 1,
    carrera: 'DEMO-CAR-SIS',
    usuario: true
  },
  {
    numero_matricula: 'DEMO-EST-002',
    identificacion: 'DEMO-EST-002',
    nombres: 'Luis',
    apellidos: 'Fernández Rojas',
    correo: 'demo.estudiante2@universidad.test',
    telefono: '0999000002',
    fecha_nacimiento: '2003-11-22',
    estado_academico: ACADEMIC_STATUS.ACTIVE,
    nivel_academico_actual: 2,
    carrera: 'DEMO-CAR-SIS',
    usuario: true
  },
  {
    numero_matricula: 'DEMO-EST-003',
    identificacion: 'DEMO-EST-003',
    nombres: 'Sofía',
    apellidos: 'Villalba Cruz',
    correo: 'demo.estudiante3@universidad.test',
    telefono: '0999000003',
    fecha_nacimiento: '2004-02-14',
    estado_academico: ACADEMIC_STATUS.ACTIVE,
    nivel_academico_actual: 2,
    carrera: 'DEMO-CAR-SIS',
    usuario: true
  },
  {
    numero_matricula: 'DEMO-EST-004',
    identificacion: 'DEMO-EST-004',
    nombres: 'Jorge',
    apellidos: 'Almeida Vera',
    correo: 'demo.estudiante4@universidad.test',
    telefono: '0999000004',
    fecha_nacimiento: '2003-07-30',
    estado_academico: ACADEMIC_STATUS.INACTIVE,
    nivel_academico_actual: 1,
    carrera: 'DEMO-CAR-SIS',
    usuario: true
  },
  {
    numero_matricula: 'DEMO-EST-005',
    identificacion: 'DEMO-EST-005',
    nombres: 'Camila',
    apellidos: 'Rivas Peña',
    correo: 'demo.estudiante5@universidad.test',
    telefono: '0999000005',
    fecha_nacimiento: '2004-09-05',
    estado_academico: ACADEMIC_STATUS.ACTIVE,
    nivel_academico_actual: 2,
    carrera: 'DEMO-CAR-SIS',
    usuario: false
  },
  {
    numero_matricula: 'DEMO-EST-006',
    identificacion: 'DEMO-EST-006',
    nombres: 'Andrés',
    apellidos: 'Cordero Salinas',
    correo: 'demo.estudiante6@universidad.test',
    telefono: '0999000006',
    fecha_nacimiento: '2003-04-18',
    estado_academico: ACADEMIC_STATUS.ACTIVE,
    nivel_academico_actual: 1,
    carrera: 'DEMO-CAR-ADM',
    usuario: false
  },
  {
    numero_matricula: 'DEMO-EST-007',
    identificacion: 'DEMO-EST-007',
    nombres: 'Valeria',
    apellidos: 'Torres León',
    correo: 'demo.estudiante7@universidad.test',
    telefono: '0999000007',
    fecha_nacimiento: '2002-12-01',
    estado_academico: ACADEMIC_STATUS.ACTIVE,
    nivel_academico_actual: 3,
    carrera: 'DEMO-CAR-SIS',
    usuario: false
  },
  {
    numero_matricula: 'DEMO-EST-008',
    identificacion: 'DEMO-EST-008',
    nombres: 'Mateo',
    apellidos: 'Núñez Ibáñez',
    correo: 'demo.estudiante8@universidad.test',
    telefono: '0999000008',
    fecha_nacimiento: '2003-06-25',
    estado_academico: ACADEMIC_STATUS.ACTIVE,
    nivel_academico_actual: 2,
    carrera: 'DEMO-CAR-ADM',
    usuario: false
  }
];

const USUARIOS = [
  {
    nombres: 'Administrador',
    apellidos: 'Demostración',
    correo: 'demo.admin@universidad.test',
    rol: ROLE_CODES.ADMIN
  },
  {
    nombres: 'Gestor',
    apellidos: 'Matrículas Demostración',
    correo: 'demo.gestor@universidad.test',
    rol: ROLE_CODES.ENROLLMENT_MANAGER
  },
  ...ESTUDIANTES.filter((estudiante) => estudiante.usuario).map((estudiante) => ({
    nombres: estudiante.nombres,
    apellidos: estudiante.apellidos,
    correo: estudiante.correo,
    rol: ROLE_CODES.STUDENT,
    estudiante: estudiante.numero_matricula
  })),
  ...DOCENTES.filter((docente) => docente.conUsuario).map((docente) => ({
    nombres: docente.nombres,
    apellidos: docente.apellidos,
    correo: docente.correo,
    rol: ROLE_CODES.TEACHER,
    docente: docente.identificacion
  }))
];

const MATRICULAS_PREVIAS = [
  { estudiante: 'DEMO-EST-002', periodo: 'DEMO-PER-ANT', asignatura: 'ASI-FUNPRO', paralelo: 'A',     estado: ENROLLMENT_STATUS.PASSED, calificacion: '8.5', dias: 220 },
  { estudiante: 'DEMO-EST-002', periodo: 'DEMO-PER-ANT', asignatura: 'ASI-POO', paralelo: 'A',     estado: ENROLLMENT_STATUS.PASSED, calificacion: '9.0', dias: 220 },
  { estudiante: 'DEMO-EST-002', periodo: 'DEMO-PER-ANT', asignatura: 'ASI-MATDIS', paralelo: 'A',     estado: ENROLLMENT_STATUS.PASSED, calificacion: '7.5', dias: 220 },
  { estudiante: 'DEMO-EST-003', periodo: 'DEMO-PER-ANT', asignatura: 'ASI-BD', paralelo: 'A',     estado: ENROLLMENT_STATUS.PASSED, calificacion: '8.0', dias: 218 },
  { estudiante: 'DEMO-EST-003', periodo: 'DEMO-PER-ANT', asignatura: 'ASI-DEVWEB', paralelo: 'A',     estado: ENROLLMENT_STATUS.PASSED, calificacion: '7.0', dias: 218 },
  { estudiante: 'DEMO-EST-005', periodo: 'DEMO-PER-ANT', asignatura: 'ASI-FUNPRO', paralelo: 'A',     estado: ENROLLMENT_STATUS.FAILED, calificacion: '4.5', dias: 216 },
  { estudiante: 'DEMO-EST-005', periodo: 'DEMO-PER-ANT', asignatura: 'ASI-POO', paralelo: 'A',     estado: ENROLLMENT_STATUS.PASSED, calificacion: '7.8', dias: 216 },
  { estudiante: 'DEMO-EST-006', periodo: 'DEMO-PER-ANT', asignatura: 'ASI-CONTAB', paralelo: 'A',     estado: ENROLLMENT_STATUS.PASSED, calificacion: '8.2', dias: 215 },
  { estudiante: 'DEMO-EST-007', periodo: 'DEMO-PER-ANT', asignatura: 'ASI-FUNPRO', paralelo: 'A',     estado: ENROLLMENT_STATUS.PASSED, calificacion: '9.5', dias: 214 },
  { estudiante: 'DEMO-EST-007', periodo: 'DEMO-PER-ANT', asignatura: 'ASI-MATDIS', paralelo: 'A',     estado: ENROLLMENT_STATUS.PASSED, calificacion: '8.0', dias: 214 },
  { estudiante: 'DEMO-EST-007', periodo: 'DEMO-PER-ANT', asignatura: 'ASI-DEVWEB', paralelo: 'A',     estado: ENROLLMENT_STATUS.PASSED, calificacion: '7.8', dias: 214 },
  { estudiante: 'DEMO-EST-008', periodo: 'DEMO-PER-ANT', asignatura: 'ASI-CONTAB', paralelo: 'A',     estado: ENROLLMENT_STATUS.PASSED, calificacion: '7.0', dias: 213 }
];

const MATRICULAS_ACTUALES = [
  { estudiante: 'DEMO-EST-003', periodo: 'DEMO-PER-ACT', asignatura: 'ASI-BD', paralelo: 'A', dias: 3 },
  { estudiante: 'DEMO-EST-003', periodo: 'DEMO-PER-ACT', asignatura: 'ASI-DEVWEB', paralelo: 'A', dias: 3 },
  { estudiante: 'DEMO-EST-005', periodo: 'DEMO-PER-ACT', asignatura: 'ASI-FUNPRO', paralelo: 'A', dias: 2 },
  { estudiante: 'DEMO-EST-005', periodo: 'DEMO-PER-ACT', asignatura: 'ASI-REDES', paralelo: 'A', dias: 2 },
  { estudiante: 'DEMO-EST-005', periodo: 'DEMO-PER-ACT', asignatura: 'ASI-ISW', paralelo: 'A', dias: 2 },
  { estudiante: 'DEMO-EST-006', periodo: 'DEMO-PER-ACT', asignatura: 'ASI-CONTAB', paralelo: 'A', dias: 1 },
  { estudiante: 'DEMO-EST-007', periodo: 'DEMO-PER-ACT', asignatura: 'ASI-REDES', paralelo: 'A', dias: 1 },
  { estudiante: 'DEMO-EST-007', periodo: 'DEMO-PER-ACT', asignatura: 'ASI-ISW', paralelo: 'A', dias: 1 },
  { estudiante: 'DEMO-EST-008', periodo: 'DEMO-PER-ACT', asignatura: 'ASI-MARKET', paralelo: 'A', dias: 0 }
];

const NOMBRES_RESUMEN = [
  'Facultades',
  'Carreras',
  'Asignaturas',
  'Malla',
  'Docentes',
  'Periodos',
  'Cursos',
  'Estudiantes',
  'Usuarios',
  'Matrículas'
];

const inicializarResumen = () =>
  Object.fromEntries(NOMBRES_RESUMEN.map((nombre) => [nombre, { creados: 0, existentes: 0 }]));

const registrarResultado = (resumen, entidad, creado) => {
  if (creado) {
    resumen[entidad].creados += 1;
  } else {
    resumen[entidad].existentes += 1;
  }
};

const obtenerOCrear = async (modelo, donde, valores, transaction) => {
  const [registro, creado] = await modelo.findOrCreate({
    where: donde,
    defaults: valores,
    transaction
  });
  return { registro, creado };
};

const verificarEntorno = () => {
  if (environment.nodeEnv !== 'development') {
    throw new Error(
      `El seeder de demostracion solo puede ejecutarse en desarrollo. NODE_ENV actual: ${environment.nodeEnv}`
    );
  }

  if (/test/i.test(environment.database.name)) {
    throw new Error(`El seeder de demostracion no debe ejecutarse sobre la base de datos de pruebas: ${environment.database.name}`);
  }

  console.log('Entorno de ejecución:', environment.nodeEnv);
  console.log('Base de datos de desarrollo:', environment.database.name);
  console.log('Host:', environment.database.host);
};

const mostrarResumen = (resumen) => {
  console.log('');
  console.log('Datos de demostración preparados');
  console.log('');

  for (const nombre of NOMBRES_RESUMEN) {
    const total = resumen[nombre].creados + resumen[nombre].existentes;
    console.log(
      `${nombre}: ${total} (creados: ${resumen[nombre].creados}, ya existentes: ${resumen[nombre].existentes})`
    );
  }

  console.log('');
  console.log('Escenarios de prueba:');
  console.log('Primera matrícula:');
  console.log('- Identificación: DEMO-EST-001');
  console.log('Renovación:');
  console.log('- Identificación: DEMO-EST-002');
  console.log('Matrícula parcial:');
  console.log('- Identificación: DEMO-EST-003');
  console.log('Estudiante inactivo:');
  console.log('- Identificación: DEMO-EST-004');
  console.log('Asignatura sin oferta (para renovación):');
  console.log('- ASI-MATDIS (sin curso abierto en el periodo actual)');
  console.log('Curso con pocos cupos:');
  console.log('- ASI-REDES (paralelo A, periodo actual)');
  console.log('Curso lleno:');
  console.log('- ASI-ISW (paralelo A, periodo actual)');
  console.log('Periodo cerrado:');
  console.log('- DEMO-PER-ANT');

  console.log('');
  console.log('Usuarios de demostración:');
  console.log('- ADMIN: demo.admin@universidad.test');
  console.log('- GESTOR_MATRICULA: demo.gestor@universidad.test');
  console.log('- ESTUDIANTE: demo.estudiante1@universidad.test');
  console.log('- ESTUDIANTE: demo.estudiante2@universidad.test');
  console.log('- ESTUDIANTE: demo.estudiante3@universidad.test');
  console.log('- ESTUDIANTE: demo.estudiante4@universidad.test');
  console.log('- DOCENTE: demo.docente1@universidad.test');
  console.log('- DOCENTE: demo.docente2@universidad.test');

  if (!process.env.DEMO_USER_PASSWORD) {
    console.log('');
    console.warn(
      `ADVERTENCIA: No se definio DEMO_USER_PASSWORD. Se utilizo la contrasena de demostracion por defecto "${CONTRASENA_DEMO_POR_DEFECTO}". Esta contrasena es SOLO para desarrollo y no debe usarse en produccion.`
    );
  }
};

const ejecutar = async () => {
  verificarEntorno();

  await sequelize.authenticate();

  const passwordHash = await generarHashPassword(CONTRASENA_DEMO);
  const resumen = inicializarResumen();

  await sequelize.transaction(async (transaction) => {
    const roles = {};

    for (const codigo of Object.values(ROLE_CODES)) {
      const rol = await Rol.findOne({ where: { codigo }, transaction });

      if (!rol) {
        throw new Error(`Rol no encontrado: ${codigo}`);
      }

      roles[codigo] = rol;
    }

    const facultades = {};

    for (const datos of FACULTADES) {
      const { registro, creado } = await obtenerOCrear(Facultad, { codigo: datos.codigo }, datos, transaction);
      facultades[datos.codigo] = registro;
      registrarResultado(resumen, 'Facultades', creado);
    }

    const carreras = {};

    for (const datos of CARRERAS) {
      const valores = { ...datos, facultad_id: facultades[datos.facultad].id };
      delete valores.facultad;
      const { registro, creado } = await obtenerOCrear(Carrera, { codigo: datos.codigo }, valores, transaction);
      carreras[datos.codigo] = registro;
      registrarResultado(resumen, 'Carreras', creado);
    }

    const asignaturas = {};

    for (const datos of ASIGNATURAS) {
      const { registro, creado } = await obtenerOCrear(Asignatura, { codigo: datos.codigo }, datos, transaction);
      asignaturas[datos.codigo] = registro;
      registrarResultado(resumen, 'Asignaturas', creado);
    }

    for (const [codigoCarrera, codigosAsignatura] of MALLA) {
      const carrera = carreras[codigoCarrera];

      for (const codigoAsignatura of codigosAsignatura) {
        const asignatura = asignaturas[codigoAsignatura];
        const existente = await CarreraAsignatura.findOne({
          where: { carrera_id: carrera.id, asignatura_id: asignatura.id },
          transaction
        });

        if (!existente) {
          await CarreraAsignatura.create(
            { carrera_id: carrera.id, asignatura_id: asignatura.id },
            { transaction }
          );
          registrarResultado(resumen, 'Malla', true);
        } else {
          registrarResultado(resumen, 'Malla', false);
        }
      }
    }

    const docentes = {};

    for (const datos of DOCENTES) {
      const valores = { ...datos };
      delete valores.conUsuario;
      const { registro, creado } = await obtenerOCrear(Docente, { identificacion: datos.identificacion }, valores, transaction);
      docentes[datos.identificacion] = registro;
      registrarResultado(resumen, 'Docentes', creado);
    }

    const periodos = {};

    for (const datos of PERIODOS) {
      const { registro, creado } = await obtenerOCrear(PeriodoAcademico, { codigo: datos.codigo }, datos, transaction);
      periodos[datos.codigo] = registro;
      registrarResultado(resumen, 'Periodos', creado);
    }

    const cursos = {};

    for (const datos of CURSOS) {
      const periodo = periodos[datos.periodo];
      const asignatura = asignaturas[datos.asignatura];
      const docente = docentes[datos.docente];
      const valores = {
        periodo_id: periodo.id,
        asignatura_id: asignatura.id,
        docente_id: docente.id,
        paralelo: datos.paralelo,
        aula: datos.aula,
        horario: datos.horario,
        cupo_maximo: datos.cupo_maximo,
        estado: datos.estado
      };
      const { registro, creado } = await obtenerOCrear(
        Curso,
        { periodo_id: periodo.id, asignatura_id: asignatura.id, paralelo: datos.paralelo },
        valores,
        transaction
      );
      cursos[`${datos.periodo}|${datos.asignatura}|${datos.paralelo}`] = registro;
      registrarResultado(resumen, 'Cursos', creado);
    }

    const estudiantes = {};

    for (const datos of ESTUDIANTES) {
      const valores = { ...datos, carrera_id: carreras[datos.carrera].id };
      delete valores.carrera;
      delete valores.usuario;
      const { registro, creado } = await obtenerOCrear(
        Estudiante,
        { numero_matricula: datos.numero_matricula },
        valores,
        transaction
      );
      estudiantes[datos.numero_matricula] = registro;
      registrarResultado(resumen, 'Estudiantes', creado);
    }

    for (const datos of USUARIOS) {
      const valores = { ...datos };
      delete valores.rol;
      delete valores.estudiante;
      delete valores.docente;
      valores.rol_id = roles[datos.rol].id;
      valores.estudiante_id = datos.estudiante ? estudiantes[datos.estudiante].id : null;
      valores.docente_id = datos.docente ? docentes[datos.docente].id : null;
      valores.password_hash = passwordHash;
      valores.estado = 'activo';
      valores.debe_cambiar_password = false;

      const { registro, creado } = await obtenerOCrear(Usuario, { correo: datos.correo }, valores, transaction);
      registrarResultado(resumen, 'Usuarios', creado);
    }

    const matriculas = [
      ...MATRICULAS_PREVIAS.map((datos) => ({
        ...datos,
        estado: datos.estado,
        calificacion_final: datos.calificacion,
        fecha_matricula: haceDias(datos.dias)
      })),
      ...MATRICULAS_ACTUALES.map((datos) => ({
        ...datos,
        estado: ENROLLMENT_STATUS.ENROLLED,
        calificacion_final: null,
        fecha_matricula: haceDias(datos.dias)
      }))
    ];

    for (const datos of matriculas) {
      const estudiante = estudiantes[datos.estudiante];
      const curso = cursos[`${datos.periodo}|${datos.asignatura}|${datos.paralelo}`];

      if (!estudiante || !curso) {
        throw new Error(`No se encontro estudiante o curso para la matricula de ${datos.estudiante}`);
      }

      const valores = {
        estudiante_id: estudiante.id,
        curso_id: curso.id,
        fecha_matricula: datos.fecha_matricula,
        estado: datos.estado,
        calificacion_final: datos.calificacion_final
      };
      const { registro, creado } = await obtenerOCrear(
        Matricula,
        { estudiante_id: estudiante.id, curso_id: curso.id },
        valores,
        transaction
      );
      registrarResultado(resumen, 'Matrículas', creado);
    }
  });

  mostrarResumen(resumen);
};

try {
  await ejecutar();
} catch (error) {
  console.error('Error al cargar los datos de demostración:');
  console.error(error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
