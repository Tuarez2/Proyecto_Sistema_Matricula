import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const directorioActual = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directorioActual, '..', '.env') });

import { Op } from 'sequelize';

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
  Usuario,
  sequelize
} from '../src/models/index.js';

const MARCADOR = 'VIDEO_DEMO_2026';
const MARCADOR_GUION = 'VIDEO-DEMO-2026';
const PREFIJOS_MARCADOR = [MARCADOR, MARCADOR_GUION];

const enMarcador = (columna) => ({
  [Op.or]: PREFIJOS_MARCADOR.map((prefijo) => ({
    [columna]: { [Op.like]: `${prefijo}%` }
  }))
});

const CORREOS_CUENTAS_VIDEO = [
  'video.gestor@universidad.test',
  'video.docente@universidad.test',
  'video.estudiante1@universidad.test',
  'video.estudiante2@universidad.test'
];

const idsDe = (registros) => registros.map((registro) => registro.id);

const ejecutar = async () => {
  await sequelize.authenticate();

  const eliminados = {};

  const marcarEliminados = (entidad, cantidad) => {
    eliminados[entidad] = (eliminados[entidad] ?? 0) + cantidad;
  };

  await sequelize.transaction(async (transaction) => {
    const facultades = await Facultad.findAll({
      where: enMarcador('codigo'),
      attributes: ['id'],
      transaction
    });

    const carreras = await Carrera.findAll({
      where: enMarcador('codigo'),
      attributes: ['id'],
      transaction
    });

    const asignaturas = await Asignatura.findAll({
      where: enMarcador('codigo'),
      attributes: ['id'],
      transaction
    });

    const docentes = await Docente.findAll({
      where: enMarcador('identificacion'),
      attributes: ['id'],
      transaction
    });

    const estudiantes = await Estudiante.findAll({
      where: {
        [Op.or]: [
          enMarcador('numero_matricula'),
          enMarcador('identificacion')
        ]
      },
      attributes: ['id'],
      transaction
    });

    const periodos = await PeriodoAcademico.findAll({
      where: enMarcador('codigo'),
      attributes: ['id'],
      transaction
    });

    const idsFacultades = idsDe(facultades);
    const idsCarreras = idsDe(carreras);
    const idsAsignaturas = idsDe(asignaturas);
    const idsDocentes = idsDe(docentes);
    const idsEstudiantes = idsDe(estudiantes);
    const idsPeriodos = idsDe(periodos);

    const cursos = await Curso.findAll({
      where: {
        [Op.or]: [
          { periodo_id: { [Op.in]: idsPeriodos } },
          { asignatura_id: { [Op.in]: idsAsignaturas } },
          { docente_id: { [Op.in]: idsDocentes } }
        ]
      },
      attributes: ['id'],
      transaction
    });
    const idsCursos = idsDe(cursos);

    const matriculas = await Matricula.findAll({
      where: {
        [Op.or]: [
          { estudiante_id: { [Op.in]: idsEstudiantes } },
          { curso_id: { [Op.in]: idsCursos } }
        ]
      },
      attributes: ['id'],
      transaction
    });
    const idsMatriculas = idsDe(matriculas);

    if (idsMatriculas.length > 0) {
      const cantidad = await Matricula.destroy({ where: { id: { [Op.in]: idsMatriculas } }, transaction });
      marcarEliminados('Matrículas', cantidad);
    }

    if (idsCursos.length > 0) {
      const cantidad = await Curso.destroy({ where: { id: { [Op.in]: idsCursos } }, transaction });
      marcarEliminados('Cursos', cantidad);
    }

    const usuarios = await Usuario.findAll({
      where: {
        [Op.or]: [
          { correo: { [Op.in]: CORREOS_CUENTAS_VIDEO } },
          { estudiante_id: { [Op.in]: idsEstudiantes } },
          { docente_id: { [Op.in]: idsDocentes } }
        ]
      },
      attributes: ['id'],
      transaction
    });
    const idsUsuarios = idsDe(usuarios);

    if (idsUsuarios.length > 0) {
      const cantidad = await Usuario.destroy({ where: { id: { [Op.in]: idsUsuarios } }, transaction });
      marcarEliminados('Usuarios', cantidad);
    }

    const enlacesMalla = await CarreraAsignatura.findAll({
      where: {
        [Op.or]: [
          { carrera_id: { [Op.in]: idsCarreras } },
          { asignatura_id: { [Op.in]: idsAsignaturas } }
        ]
      },
      attributes: ['carrera_id', 'asignatura_id'],
      transaction
    });

    for (const enlace of enlacesMalla) {
      await CarreraAsignatura.destroy({
        where: { carrera_id: enlace.carrera_id, asignatura_id: enlace.asignatura_id },
        transaction
      });
      marcarEliminados('Malla', 1);
    }

    if (idsEstudiantes.length > 0) {
      const cantidad = await Estudiante.destroy({ where: { id: { [Op.in]: idsEstudiantes } }, transaction });
      marcarEliminados('Estudiantes', cantidad);
    }

    if (idsDocentes.length > 0) {
      const cantidad = await Docente.destroy({ where: { id: { [Op.in]: idsDocentes } }, transaction });
      marcarEliminados('Docentes', cantidad);
    }

    if (idsAsignaturas.length > 0) {
      const cantidad = await Asignatura.destroy({ where: { id: { [Op.in]: idsAsignaturas } }, transaction });
      marcarEliminados('Asignaturas', cantidad);
    }

    if (idsCarreras.length > 0) {
      const cantidad = await Carrera.destroy({ where: { id: { [Op.in]: idsCarreras } }, transaction });
      marcarEliminados('Carreras', cantidad);
    }

    if (idsPeriodos.length > 0) {
      const cantidad = await PeriodoAcademico.destroy({ where: { id: { [Op.in]: idsPeriodos } }, transaction });
      marcarEliminados('Periodos', cantidad);
    }

    if (idsFacultades.length > 0) {
      const cantidad = await Facultad.destroy({ where: { id: { [Op.in]: idsFacultades } }, transaction });
      marcarEliminados('Facultades', cantidad);
    }
  });

  console.log('');
  console.log(`Limpieza del dataset de video (${MARCADOR}) completada`);

  const total = Object.values(eliminados).reduce((suma, cantidad) => suma + cantidad, 0);

  if (total === 0) {
    console.log('No se encontraron registros temporales para eliminar.');
  } else {
    for (const [entidad, cantidad] of Object.entries(eliminados)) {
      console.log(`${entidad}: ${cantidad}`);
    }

    console.log(`Total: ${total} registros eliminados.`);
  }
};

try {
  await ejecutar();
} catch (error) {
  console.error('Error al limpiar el dataset de video:');
  console.error(error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
