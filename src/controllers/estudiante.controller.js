import Estudiante from '../models/Estudiante.js';


export const crearEstudiante = async (req, res) => {
  try {
    const {
      carrera_id,
      numero_matricula,
      identificacion,
      nombres,
      apellidos,
      correo,
      fecha_nacimiento,
      estado
    } = req.body;

  
    if (!carrera_id || !numero_matricula || !identificacion || !nombres || !apellidos || !correo) {
      return res.status(400).json({
        message: 'Los campos carrera_id, numero_matricula, identificacion, nombres, apellidos y correo son obligatorios.'
      });
    }

    const nuevoEstudiante = await Estudiante.create({
      carrera_id,
      numero_matricula,
      identificacion,
      nombres,
      apellidos,
      correo,
      fecha_nacimiento,
      estado: estado !== undefined ? estado : true
    });

    return res.status(201).json(nuevoEstudiante);
  } catch (error) {
  
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'El número de matrícula, la identificación o el correo ya se encuentran registrados.'
      });
    }

    // Validación de formato de email (isEmail: true)
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'El correo electrónico no tiene un formato válido.'
      });
    }

    // Violación de clave foránea si la Carrera no existe
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'La carrera especificada (carrera_id) no existe.'
      });
    }

    return res.status(500).json({
      message: 'Error interno al intentar crear el estudiante.',
      error: error.message
    });
  }
};


export const obtenerEstudiantes = async (req, res) => {
  try {
    const estudiantes = await Estudiante.findAll({
      include: [
        { association: 'carrera' }
      ]
    });
    return res.status(200).json(estudiantes);
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener la lista de estudiantes.',
      error: error.message
    });
  }
};


export const obtenerEstudiantePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const estudiante = await Estudiante.findByPk(id, {
      include: [
        { association: 'carrera' },
        { association: 'cursos' } 
      ]
    });

    if (!estudiante) {
      return res.status(404).json({ message: 'Estudiante no encontrado.' });
    }

    return res.status(200).json(estudiante);
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener los datos del estudiante.',
      error: error.message
    });
  }
};

export const actualizarEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      carrera_id,
      numero_matricula,
      identificacion,
      nombres,
      apellidos,
      correo,
      fecha_nacimiento,
      estado
    } = req.body;

    const estudiante = await Estudiante.findByPk(id);
    if (!estudiante) {
      return res.status(404).json({ message: 'Estudiante no encontrado.' });
    }

    await estudiante.update({
      carrera_id,
      numero_matricula,
      identificacion,
      nombres,
      apellidos,
      correo,
      fecha_nacimiento,
      estado
    });

    return res.status(200).json({
      message: 'Estudiante actualizado exitosamente.',
      estudiante
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'La matrícula, identificación o correo ya están en uso por otro estudiante.'
      });
    }
    return res.status(500).json({
      message: 'Error al actualizar el estudiante.',
      error: error.message
    });
  }
};


export const eliminarEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const estudiante = await Estudiante.findByPk(id);

    if (!estudiante) {
      return res.status(404).json({ message: 'Estudiante no encontrado.' });
    }

    await estudiante.destroy();
    return res.status(200).json({ message: 'Estudiante eliminado correctamente.' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'No se puede eliminar el estudiante porque posee matrículas o registros en cursos.'
      });
    }

    return res.status(500).json({
      message: 'Error al eliminar el estudiante.',
      error: error.message
    });
  }
};