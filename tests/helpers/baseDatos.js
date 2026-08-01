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
  Sesion,
  Usuario,
  sequelize
} from '../../src/models/index.js';

export const limpiarDatosPrueba = async (sufijo) => {
  const usuarios = await Usuario.findAll({ where: { correo: { [Op.like]: `%${sufijo}%` } }, attributes: ['id'] });
  const usuarioIds = usuarios.map((usuario) => usuario.id);

  if (usuarioIds.length > 0) {
    await Sesion.destroy({ where: { usuario_id: { [Op.in]: usuarioIds } } });
    await Usuario.destroy({ where: { id: { [Op.in]: usuarioIds } } });
  }

  const periodos = await PeriodoAcademico.findAll({ where: { nombre: { [Op.like]: `%${sufijo}%` } }, attributes: ['id'] });
  const asignaturas = await Asignatura.findAll({ where: { nombre: { [Op.like]: `%${sufijo}%` } }, attributes: ['id'] });
  const docentes = await Docente.findAll({ where: { correo: { [Op.like]: `%${sufijo}%` } }, attributes: ['id'] });
  const carreras = await Carrera.findAll({ where: { nombre: { [Op.like]: `%${sufijo}%` } }, attributes: ['id'] });
  const estudiantes = await Estudiante.findAll({ where: { correo: { [Op.like]: `%${sufijo}%` } }, attributes: ['id'] });

  const periodoIds = periodos.map((periodo) => periodo.id);
  const asignaturaIds = asignaturas.map((asignatura) => asignatura.id);
  const docenteIds = docentes.map((docente) => docente.id);
  const carreraIds = carreras.map((carrera) => carrera.id);
  const estudianteIds = estudiantes.map((estudiante) => estudiante.id);

  const cursos = await Curso.findAll({
    where: {
      [Op.or]: [
        { periodo_id: { [Op.in]: periodoIds } },
        { asignatura_id: { [Op.in]: asignaturaIds } },
        { docente_id: { [Op.in]: docenteIds } }
      ]
    },
    attributes: ['id']
  });
  const cursoIds = cursos.map((curso) => curso.id);

  if (cursoIds.length > 0 || estudianteIds.length > 0) {
    await Matricula.destroy({
      where: {
        [Op.or]: [
          { curso_id: { [Op.in]: cursoIds } },
          { estudiante_id: { [Op.in]: estudianteIds } }
        ]
      }
    });
  }

  if (cursoIds.length > 0) await Curso.destroy({ where: { id: { [Op.in]: cursoIds } } });
  if (carreraIds.length > 0 || asignaturaIds.length > 0) {
    await CarreraAsignatura.destroy({
      where: {
        [Op.or]: [
          { carrera_id: { [Op.in]: carreraIds } },
          { asignatura_id: { [Op.in]: asignaturaIds } }
        ]
      }
    });
  }
  if (estudianteIds.length > 0) await Estudiante.destroy({ where: { id: { [Op.in]: estudianteIds } } });
  if (asignaturaIds.length > 0) await Asignatura.destroy({ where: { id: { [Op.in]: asignaturaIds } } });
  if (docenteIds.length > 0) await Docente.destroy({ where: { id: { [Op.in]: docenteIds } } });
  if (periodoIds.length > 0) await PeriodoAcademico.destroy({ where: { id: { [Op.in]: periodoIds } } });
  if (carreraIds.length > 0) await Carrera.destroy({ where: { id: { [Op.in]: carreraIds } } });

  await Facultad.destroy({ where: { nombre: { [Op.like]: `%${sufijo}%` } } });
};

export const cerrarConexionBaseDatos = () => sequelize.close();
