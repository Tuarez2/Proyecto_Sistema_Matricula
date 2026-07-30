import Docente from '../models/docente.model.js';


export const crearDocente = async (req, res) => {
  try {
    const { identificacion, nombres, apellidos, correo, titulo, estado } = req.body;

   
    if (!identificacion || !nombres || !apellidos || !correo) {
      return res.status(400).json({
        message: 'Los campos identificacion, nombres, apellidos y correo son obligatorios.'
      });
    }

    const nuevoDocente = await Docente.create({
      identificacion,
      nombres,
      apellidos,
      correo,
      titulo,
      estado: estado !== undefined ? estado : true
    });

    return res.status(201).json(nuevoDocente);
  } catch (error) {
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'La identificación o el correo ingresado ya pertenecen a otro docente.'
      });
    }

    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'El correo electrónico ingresado no tiene un formato válido.'
      });
    }

    return res.status(500).json({
      message: 'Error interno al intentar crear el docente.',
      error: error.message
    });
  }
};


export const obtenerDocentes = async (req, res) => {
  try {
    const docentes = await Docente.findAll();
    return res.status(200).json(docentes);
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener la lista de docentes.',
      error: error.message
    });
  }
};


export const obtenerDocentePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const docente = await Docente.findByPk(id, {
      include: [{ association: 'cursos' }] 
    });

    if (!docente) {
      return res.status(404).json({ message: 'Docente no encontrado.' });
    }

    return res.status(200).json(docente);
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener los datos del docente.',
      error: error.message
    });
  }
};


export const actualizarDocente = async (req, res) => {
  try {
    const { id } = req.params;
    const { identificacion, nombres, apellidos, correo, titulo, estado } = req.body;

    const docente = await Docente.findByPk(id);
    if (!docente) {
      return res.status(404).json({ message: 'Docente no encontrado.' });
    }

    await docente.update({
      identificacion,
      nombres,
      apellidos,
      correo,
      titulo,
      estado
    });

    return res.status(200).json({
      message: 'Docente actualizado exitosamente.',
      docente
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'La identificación o el correo ya están en uso por otro registro.'
      });
    }
    return res.status(500).json({
      message: 'Error al actualizar el docente.',
      error: error.message
    });
  }
};


export const eliminarDocente = async (req, res) => {
  try {
    const { id } = req.params;
    const docente = await Docente.findByPk(id);

    if (!docente) {
      return res.status(404).json({ message: 'Docente no encontrado.' });
    }

    await docente.destroy();
    return res.status(200).json({ message: 'Docente eliminado correctamente.' });
  } catch (error) {

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'No se puede eliminar el docente porque tiene cursos asignados.'
      });
    }

    return res.status(500).json({
      message: 'Error al eliminar el docente.',
      error: error.message
    });
  }
};