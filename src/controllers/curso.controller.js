import Curso from '../models/curso.model.js';


export const crearCurso = async (req, res) => {
  try {
    const {
      periodo_id,
      asignatura_id,
      docente_id,
      paralelo,
      cupo_maximo,
      horario,
      aula,
      estado
    } = req.body;

   
    if (!periodo_id || !asignatura_id || !docente_id || !paralelo || !cupo_maximo) {
      return res.status(400).json({
        message: 'Los campos periodo_id, asignatura_id, docente_id, paralelo y cupo_maximo son obligatorios.'
      });
    }

    const nuevoCurso = await Curso.create({
      periodo_id,
      asignatura_id,
      docente_id,
      paralelo,
      cupo_maximo,
      horario,
      aula,
      estado: estado !== undefined ? estado : true
    });

    return res.status(201).json(nuevoCurso);
  } catch (error) {
   
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'Ya existe un curso registrado para la misma asignatura, periodo académico y paralelo.'
      });
    }

  
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'El periodo académico, la asignatura o el docente ingresado no existe.'
      });
    }

    return res.status(500).json({
      message: 'Error interno al intentar crear el curso.',
      error: error.message
    });
  }
};


export const obtenerCursos = async (req, res) => {
  try {
    const cursos = await Curso.findAll({
      include: [
        { association: 'asignatura' },
        { association: 'docente' },
        { association: 'periodo' }
      ]
    });
    return res.status(200).json(cursos);
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener la lista de cursos.',
      error: error.message
    });
  }
};


export const obtenerCursoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const curso = await Curso.findByPk(id, {
      include: [
        { association: 'asignatura' },
        { association: 'docente' },
        { association: 'periodo' },
        { association: 'estudiantes' } 
      ]
    });

    if (!curso) {
      return res.status(404).json({ message: 'Curso no encontrado.' });
    }

    return res.status(200).json(curso);
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener el curso.',
      error: error.message
    });
  }
};


export const actualizarCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      periodo_id,
      asignatura_id,
      docente_id,
      paralelo,
      cupo_maximo,
      horario,
      aula,
      estado
    } = req.body;

    const curso = await Curso.findByPk(id);
    if (!curso) {
      return res.status(404).json({ message: 'Curso no encontrado.' });
    }

    await curso.update({
      periodo_id,
      asignatura_id,
      docente_id,
      paralelo,
      cupo_maximo,
      horario,
      aula,
      estado
    });

    return res.status(200).json({
      message: 'Curso actualizado exitosamente.',
      curso
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'Ya existe un curso registrado para esa asignatura, periodo y paralelo.'
      });
    }
    return res.status(500).json({
      message: 'Error al actualizar el curso.',
      error: error.message
    });
  }
};


export const eliminarCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const curso = await Curso.findByPk(id);

    if (!curso) {
      return res.status(404).json({ message: 'Curso no encontrado.' });
    }

    await curso.destroy();
    return res.status(200).json({ message: 'Curso eliminado correctamente.' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'No se puede eliminar el curso porque ya posee estudiantes o matrículas asociadas.'
      });
    }

    return res.status(500).json({
      message: 'Error al eliminar el curso.',
      error: error.message
    });
  }
};