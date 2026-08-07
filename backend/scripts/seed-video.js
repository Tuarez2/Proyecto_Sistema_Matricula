import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const directorioActual = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directorioActual, '..', '.env') });

import {
  ACADEMIC_PERIOD_STATUS,
  ACADEMIC_STATUS,
  COURSE_STATUS,
  ENROLLMENT_STATUS,
  ROLE_CODES,
  USER_STATUS
} from '../src/constants/domain.constants.js';
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
} from '../src/models/index.js';
import { generarHashPassword } from '../src/utils/password.js';

const MARCADOR = 'VIDEO_DEMO_2026';
const VARIABLE_PASSWORD = 'VIDEO_DEMO_PASSWORD';

const CORREOS_CUENTAS = [
  'video.gestor@universidad.test',
  'video.docente@universidad.test',
  'video.estudiante1@universidad.test',
  'video.estudiante2@universidad.test'
];

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

const FACULTAD = {
  codigo: `${MARCADOR}-FAC`,
  nombre: 'Facultad de Ciencias Aplicadas',
  activo: true
};

const CARRERA = {
  codigo: `${MARCADOR}-CAR`,
  nombre: 'Ingeniería en Sistemas',
  duracion_semestres: 8,
  activo: true
};

const ASIGNATURAS = [
  { codigo: `${MARCADOR}-AS1`, nombre: 'Programación I', creditos: 4, nivel_academico: 1, activo: true },
  { codigo: `${MARCADOR}-AS2`, nombre: 'Bases de Datos', creditos: 4, nivel_academico: 1, activo: true },
  { codigo: `${MARCADOR}-AS3`, nombre: 'Programación II', creditos: 4, nivel_academico: 2, activo: true },
  { codigo: `${MARCADOR}-AS4`, nombre: 'Ingeniería de Software', creditos: 4, nivel_academico: 2, activo: true }
];

const DOCENTE = {
  identificacion: 'VIDEO-DEMO-2026-DOC',
  nombres: 'Laura',
  apellidos: 'Gutiérrez Mendoza',
  correo: 'video.docente@universidad.test',
  telefono: '0987654321',
  especialidad: 'Ingeniería de Software',
  activo: true
};

const PERIODOS = [
  {
    codigo: `${MARCADOR}-PA`,
    nombre: 'Periodo 2026-A',
    fecha_inicio: formatearFecha(enDias(-200)),
    fecha_fin: formatearFecha(enDias(-15)),
    fecha_inicio_matricula: enDias(-230),
    fecha_fin_matricula: enDias(-215),
    estado: ACADEMIC_PERIOD_STATUS.CLOSED
  },
  {
    codigo: `${MARCADOR}-PC`,
    nombre: 'Periodo 2026-B',
    fecha_inicio: formatearFecha(enDias(20)),
    fecha_fin: formatearFecha(enDias(200)),
    fecha_inicio_matricula: enDias(-7),
    fecha_fin_matricula: enDias(30),
    estado: ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN
  }
];

const CURSOS = [
  {
    periodo: `${MARCADOR}-PA`,
    asignatura: `${MARCADOR}-AS1`,
    paralelo: 'A',
    aula: 'A-101',
    horario: 'Lunes 07:00 - 09:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: `${MARCADOR}-PA`,
    asignatura: `${MARCADOR}-AS2`,
    paralelo: 'A',
    aula: 'A-102',
    horario: 'Martes 10:00 - 12:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: `${MARCADOR}-PC`,
    asignatura: `${MARCADOR}-AS3`,
    paralelo: 'A',
    aula: 'B-201',
    horario: 'Miércoles 07:00 - 09:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  },
  {
    periodo: `${MARCADOR}-PC`,
    asignatura: `${MARCADOR}-AS4`,
    paralelo: 'A',
    aula: 'B-202',
    horario: 'Jueves 14:00 - 16:00',
    cupo_maximo: 30,
    estado: COURSE_STATUS.OPEN
  }
];

const ESTUDIANTES = [
  {
    numero_matricula: `${MARCADOR}-E1`,
    identificacion: 'VIDEO-DEMO-2026-E1',
    nombres: 'Valentina',
    apellidos: 'Paredes Ortiz',
    correo: 'video.estudiante1@universidad.test',
    telefono: '0987654321',
    fecha_nacimiento: '2004-05-10',
    estado_academico: ACADEMIC_STATUS.ACTIVE,
    nivel_academico_actual: 1
  },
  {
    numero_matricula: `${MARCADOR}-E2`,
    identificacion: 'VIDEO-DEMO-2026-E2',
    nombres: 'Sebastián',
    apellidos: 'Castro Lima',
    correo: 'video.estudiante2@universidad.test',
    telefono: '0987654321',
    fecha_nacimiento: '2003-11-22',
    estado_academico: ACADEMIC_STATUS.ACTIVE,
    nivel_academico_actual: 2
  }
];

const USUARIOS = [
  {
    nombres: 'Carmen',
    apellidos: 'Vega Ríos',
    correo: 'video.gestor@universidad.test',
    rol: ROLE_CODES.ENROLLMENT_MANAGER
  },
  {
    nombres: 'Laura',
    apellidos: 'Gutiérrez Mendoza',
    correo: 'video.docente@universidad.test',
    rol: ROLE_CODES.TEACHER,
    docente: DOCENTE.identificacion
  },
  {
    nombres: 'Valentina',
    apellidos: 'Paredes Ortiz',
    correo: 'video.estudiante1@universidad.test',
    rol: ROLE_CODES.STUDENT,
    estudiante: ESTUDIANTES[0].numero_matricula
  },
  {
    nombres: 'Sebastián',
    apellidos: 'Castro Lima',
    correo: 'video.estudiante2@universidad.test',
    rol: ROLE_CODES.STUDENT,
    estudiante: ESTUDIANTES[1].numero_matricula
  }
];

const MATRICULAS_PREVIAS = [
  {
    estudiante: `${MARCADOR}-E2`,
    periodo: `${MARCADOR}-PA`,
    asignatura: `${MARCADOR}-AS1`,
    paralelo: 'A',
    estado: ENROLLMENT_STATUS.PASSED,
    calificacion: '8.5',
    dias: 220
  },
  {
    estudiante: `${MARCADOR}-E2`,
    periodo: `${MARCADOR}-PA`,
    asignatura: `${MARCADOR}-AS2`,
    paralelo: 'A',
    estado: ENROLLMENT_STATUS.PASSED,
    calificacion: '9.0',
    dias: 220
  }
];

const MATRICULAS_ACTUALES = [
  {
    estudiante: `${MARCADOR}-E2`,
    periodo: `${MARCADOR}-PC`,
    asignatura: `${MARCADOR}-AS3`,
    paralelo: 'A',
    estado: ENROLLMENT_STATUS.ENROLLED,
    dias: 2
  },
  {
    estudiante: `${MARCADOR}-E2`,
    periodo: `${MARCADOR}-PC`,
    asignatura: `${MARCADOR}-AS4`,
    paralelo: 'A',
    estado: ENROLLMENT_STATUS.ENROLLED,
    dias: 2
  }
];

const resumen = {
  Facultades: { creados: 0, existentes: 0 },
  Carreras: { creados: 0, existentes: 0 },
  Asignaturas: { creados: 0, existentes: 0 },
  Malla: { creados: 0, existentes: 0 },
  Docentes: { creados: 0, existentes: 0 },
  Periodos: { creados: 0, existentes: 0 },
  Cursos: { creados: 0, existentes: 0 },
  Estudiantes: { creados: 0, existentes: 0 },
  Usuarios: { creados: 0, existentes: 0 },
  Matrículas: { creados: 0, existentes: 0 }
};

const registrarResultado = (entidad, creado) => {
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

const obtenerPassword = () => {
  const password = process.env[VARIABLE_PASSWORD];

  if (!password) {
    throw new Error(
      `La variable de entorno ${VARIABLE_PASSWORD} es obligatoria para preparar el dataset de video.`
    );
  }

  return password;
};

const ejecutar = async () => {
  const password = obtenerPassword();

  await sequelize.authenticate();

  const passwordHash = await generarHashPassword(password);

  await sequelize.transaction(async (transaction) => {
    const roles = {};

    for (const codigo of Object.values(ROLE_CODES)) {
      const rol = await Rol.findOne({ where: { codigo }, transaction });

      if (!rol) {
        throw new Error(`Rol no encontrado: ${codigo}`);
      }

      roles[codigo] = rol;
    }

    const { registro: facultad, creado: facultadCreada } = await obtenerOCrear(
      Facultad,
      { codigo: FACULTAD.codigo },
      FACULTAD,
      transaction
    );
    registrarResultado('Facultades', facultadCreada);

    const valoresCarrera = { ...CARRERA, facultad_id: facultad.id };
    const { registro: carrera, creado: carreraCreada } = await obtenerOCrear(
      Carrera,
      { codigo: CARRERA.codigo },
      valoresCarrera,
      transaction
    );
    registrarResultado('Carreras', carreraCreada);

    const asignaturas = {};

    for (const datos of ASIGNATURAS) {
      const { registro, creado } = await obtenerOCrear(Asignatura, { codigo: datos.codigo }, datos, transaction);
      asignaturas[datos.codigo] = registro;
      registrarResultado('Asignaturas', creado);
    }

    for (const asignatura of Object.values(asignaturas)) {
      const existente = await CarreraAsignatura.findOne({
        where: { carrera_id: carrera.id, asignatura_id: asignatura.id },
        transaction
      });

      if (!existente) {
        await CarreraAsignatura.create(
          { carrera_id: carrera.id, asignatura_id: asignatura.id },
          { transaction }
        );
        registrarResultado('Malla', true);
      } else {
        registrarResultado('Malla', false);
      }
    }

    const { registro: docente, creado: docenteCreado } = await obtenerOCrear(
      Docente,
      { identificacion: DOCENTE.identificacion },
      DOCENTE,
      transaction
    );
    registrarResultado('Docentes', docenteCreado);

    const periodos = {};

    for (const datos of PERIODOS) {
      const { registro, creado } = await obtenerOCrear(PeriodoAcademico, { codigo: datos.codigo }, datos, transaction);
      periodos[datos.codigo] = registro;
      registrarResultado('Periodos', creado);
    }

    const cursos = {};

    for (const datos of CURSOS) {
      const valores = {
        periodo_id: periodos[datos.periodo].id,
        asignatura_id: asignaturas[datos.asignatura].id,
        docente_id: docente.id,
        paralelo: datos.paralelo,
        aula: datos.aula,
        horario: datos.horario,
        cupo_maximo: datos.cupo_maximo,
        estado: datos.estado
      };
      const { registro, creado } = await obtenerOCrear(
        Curso,
        { periodo_id: valores.periodo_id, asignatura_id: valores.asignatura_id, paralelo: datos.paralelo },
        valores,
        transaction
      );
      cursos[`${datos.periodo}|${datos.asignatura}|${datos.paralelo}`] = registro;
      registrarResultado('Cursos', creado);
    }

    const estudiantes = {};

    for (const datos of ESTUDIANTES) {
      const valores = { ...datos, carrera_id: carrera.id };
      const { registro, creado } = await obtenerOCrear(
        Estudiante,
        { numero_matricula: datos.numero_matricula },
        valores,
        transaction
      );
      estudiantes[datos.numero_matricula] = registro;
      registrarResultado('Estudiantes', creado);
    }

    for (const datos of USUARIOS) {
      const valores = { ...datos };
      delete valores.rol;
      delete valores.estudiante;
      delete valores.docente;
      valores.rol_id = roles[datos.rol].id;
      valores.estudiante_id = datos.estudiante ? estudiantes[datos.estudiante].id : null;
      valores.docente_id = datos.docente ? docente.id : null;
      valores.password_hash = passwordHash;
      valores.estado = USER_STATUS.ACTIVE;
      valores.debe_cambiar_password = false;

      const { registro, creado } = await obtenerOCrear(Usuario, { correo: datos.correo }, valores, transaction);
      registrarResultado('Usuarios', creado);
    }

    const matriculas = [
      ...MATRICULAS_PREVIAS.map((datos) => ({
        ...datos,
        calificacion_final: datos.calificacion,
        fecha_matricula: haceDias(datos.dias)
      })),
      ...MATRICULAS_ACTUALES.map((datos) => ({
        ...datos,
        calificacion_final: null,
        fecha_matricula: haceDias(datos.dias)
      }))
    ];

    for (const datos of matriculas) {
      const curso = cursos[`${datos.periodo}|${datos.asignatura}|${datos.paralelo}`];
      const estudiante = estudiantes[datos.estudiante];

      if (!curso || !estudiante) {
        throw new Error(`No se encontro curso o estudiante para la matricula de ${datos.estudiante}`);
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
      registrarResultado('Matrículas', creado);
    }
  });

  mostrarResumen();
};

const mostrarResumen = () => {
  console.log('');
  console.log(`Dataset de video (${MARCADOR}) preparado`);
  console.log('');

  for (const [entidad, valores] of Object.entries(resumen)) {
    const total = valores.creados + valores.existentes;
    console.log(
      `${entidad}: ${total} (creados: ${valores.creados}, ya existentes: ${valores.existentes})`
    );
  }

  console.log('');
  console.log('Cuentas creadas:');
  for (const correo of CORREOS_CUENTAS) {
    console.log(`- ${correo}`);
  }

  console.log('');
  console.log(
    `Todas las cuentas usan la contrasena de la variable de entorno ${VARIABLE_PASSWORD} (no se imprime su valor).`
  );
};

try {
  await ejecutar();
} catch (error) {
  console.error('Error al preparar el dataset de video:');
  console.error(error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
