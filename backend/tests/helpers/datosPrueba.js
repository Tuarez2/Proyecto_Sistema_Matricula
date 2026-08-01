import crypto from 'node:crypto';

import {
  ACADEMIC_PERIOD_STATUS,
  ACADEMIC_STATUS,
  COURSE_STATUS,
  ENROLLMENT_STATUS
} from '../../src/constants/domain.constants.js';
import {
  Asignatura,
  Carrera,
  CarreraAsignatura,
  Curso,
  Docente,
  Estudiante,
  Facultad,
  Matricula,
  PeriodoAcademico
} from '../../src/models/index.js';

export const generarSufijoPrueba = (prefijo) => `${prefijo}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const codigo = (prefijo, sufijo, longitud = 20) => {
  const base = `${prefijo}_${sufijo}`.replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
  const hash = crypto.createHash('sha1').update(`${prefijo}:${sufijo}`).digest('hex').slice(0, 8).toUpperCase();
  const espacioBase = Math.max(1, longitud - hash.length - 1);

  return `${base.slice(0, espacioBase)}_${hash}`.slice(0, longitud);
};

const fechaDia = (desplazamientoDias) => {
  const fecha = new Date();
  fecha.setUTCDate(fecha.getUTCDate() + desplazamientoDias);
  return fecha.toISOString().slice(0, 10);
};

const fechaHora = (desplazamientoDias, hora) => `${fechaDia(desplazamientoDias)}T${hora}.000Z`;

export const crearFacultadPrueba = (sufijo, datos = {}) =>
  Facultad.create({
    codigo: codigo('FAC', sufijo),
    nombre: `Facultad ${sufijo}`,
    activo: true,
    ...datos
  });

export const crearCarreraPrueba = async (sufijo, datos = {}) => {
  const { facultad: facultadRecibida, ...datosCarrera } = datos;
  const facultad = facultadRecibida ?? (await crearFacultadPrueba(sufijo));

  const carrera = await Carrera.create({
    codigo: codigo('CAR', sufijo),
    nombre: `Carrera ${sufijo}`,
    duracion_semestres: 8,
    facultad_id: facultad.id,
    activo: true,
    ...datosCarrera
  });

  return { facultad, carrera };
};

export const crearAsignaturaPrueba = (sufijo, datos = {}) =>
  Asignatura.create({
    codigo: codigo('ASG', sufijo),
    nombre: `Asignatura ${sufijo}`,
    creditos: 3,
    nivel_academico: 1,
    activo: true,
    ...datos
  });

export const crearDocentePrueba = (sufijo, datos = {}) =>
  Docente.create({
    identificacion: codigo('DOC', sufijo),
    nombres: 'Docente',
    apellidos: `Prueba ${sufijo}`,
    correo: `docente.${sufijo}@codex.test`,
    especialidad: 'Pruebas automatizadas',
    activo: true,
    ...datos
  });

export const crearPeriodoPrueba = (sufijo, datos = {}) =>
  PeriodoAcademico.create({
    codigo: codigo('PER', sufijo),
    nombre: `Periodo ${sufijo}`,
    fecha_inicio: fechaDia(-60),
    fecha_fin: fechaDia(60),
    fecha_inicio_matricula: fechaHora(-2, '00:00:00'),
    fecha_fin_matricula: fechaHora(2, '23:59:59'),
    estado: ACADEMIC_PERIOD_STATUS.ENROLLMENT_OPEN,
    ...datos
  });

export const crearEstudiantePrueba = (sufijo, carreraId, indice = 1, datos = {}) =>
  Estudiante.create({
    numero_matricula: codigo(`MAT${indice}`, sufijo, 30),
    nombres: 'Estudiante',
    apellidos: `Prueba ${indice}`,
    identificacion: codigo(`EST${indice}`, sufijo),
    correo: `estudiante.${indice}.${sufijo}@codex.test`,
    fecha_nacimiento: '2000-01-01',
    estado_academico: ACADEMIC_STATUS.ACTIVE,
    nivel_academico_actual: 1,
    carrera_id: carreraId,
    ...datos
  });

export const crearCursoPrueba = async (sufijo, datos = {}) => {
  const periodo = datos.periodo ?? (await crearPeriodoPrueba(sufijo));
  const asignatura = datos.asignatura ?? (await crearAsignaturaPrueba(sufijo));
  const docente = datos.docente ?? (await crearDocentePrueba(sufijo));

  const curso = await Curso.create({
    periodo_id: periodo.id,
    asignatura_id: asignatura.id,
    docente_id: docente.id,
    paralelo: datos.paralelo ?? 'A',
    aula: datos.aula ?? `Aula ${sufijo}`.slice(0, 50),
    horario: datos.horario ?? `Horario ${sufijo}`,
    cupo_maximo: datos.cupo_maximo ?? 5,
    estado: datos.estado ?? COURSE_STATUS.OPEN
  });

  return { periodo, asignatura, docente, curso };
};

export const crearEscenarioMatricula = async (sufijo, opciones = {}) => {
  const { facultad, carrera } = await crearCarreraPrueba(sufijo, opciones.carrera ?? {});
  const asignatura = await crearAsignaturaPrueba(sufijo, opciones.asignatura ?? {});
  const docente = await crearDocentePrueba(sufijo, opciones.docente ?? {});
  const periodo = await crearPeriodoPrueba(sufijo, opciones.periodo ?? {});
  await CarreraAsignatura.create({ carrera_id: carrera.id, asignatura_id: asignatura.id });
  const curso = await Curso.create({
    periodo_id: periodo.id,
    asignatura_id: asignatura.id,
    docente_id: docente.id,
    paralelo: opciones.paralelo ?? 'A',
    aula: `Aula ${sufijo}`.slice(0, 50),
    horario: `Horario ${sufijo}`,
    cupo_maximo: opciones.cupo_maximo ?? 5,
    estado: opciones.estadoCurso ?? COURSE_STATUS.OPEN
  });
  const estudiantes = [];
  const cantidadEstudiantes = opciones.cantidadEstudiantes ?? 2;

  for (let indice = 1; indice <= cantidadEstudiantes; indice += 1) {
    estudiantes.push(await crearEstudiantePrueba(sufijo, carrera.id, indice, opciones.estudiante ?? {}));
  }

  return { facultad, carrera, asignatura, docente, periodo, curso, estudiantes };
};

export const crearMatriculaDirecta = (estudianteId, cursoId, estado = ENROLLMENT_STATUS.ENROLLED) =>
  Matricula.create({ estudiante_id: estudianteId, curso_id: cursoId, estado });

export const fechasFueraVentana = () => ({
  fecha_inicio: fechaDia(-90),
  fecha_fin: fechaDia(90),
  fecha_inicio_matricula: fechaHora(-40, '00:00:00'),
  fecha_fin_matricula: fechaHora(-30, '23:59:59')
});
