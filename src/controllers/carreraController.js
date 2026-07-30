import Carrera from '../models/carrera.model.js';

export const crearCarrera = async (req, res) => {
  try {
    const { facultad_id, codigo, nombre, duracion_semestres, estado } = req.body;

    if (!facultad_id || !codigo || !nombre || duracion_semestres === undefined) {
      return res.status(400).json({
        message: 'Los campos facultad_id, codigo, nombre y duracion_semestres son obligatorios.'
      });
    }

    const nuevaCarrera = await Carrera.create({
      facultad_id,
      codigo,
      nombre,
      duracion_semestres,
      estado: estado !== undefined ? estado : true
    });

    return res.status(201).json(nuevaCarrera);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'El codigo de la carrera ya está en uso.'
      });
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'La facultad especificada no existe.'
      });
    }

    return res.status(500).json({
      message: 'Error interno al intentar crear la carrera.',
      error: error.message
    });
  }
};

export const obtenerCarreras = async (req, res) => {
  try {
    const carreras = await Carrera.findAll({
      include: [
        { association: 'facultad' },
        { association: 'asignaturas' },
        { association: 'estudiantes' }
      ]
    });

    return res.status(200).json(carreras);
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener la lista de carreras.',
      error: error.message
    });
  }
};

export const obtenerCarreraPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const carrera = await Carrera.findByPk(id, {
      include: [
        { association: 'facultad' },
        { association: 'asignaturas' },
        { association: 'estudiantes' }
      ]
    });

    if (!carrera) {
      return res.status(404).json({ message: 'Carrera no encontrada.' });
    }

    return res.status(200).json(carrera);
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener la carrera.',
      error: error.message
    });
  }
};

export const actualizarCarrera = async (req, res) => {
  try {
    const { id } = req.params;
    const { facultad_id, codigo, nombre, duracion_semestres, estado } = req.body;

    const carrera = await Carrera.findByPk(id);
    if (!carrera) {
      return res.status(404).json({ message: 'Carrera no encontrada.' });
    }

    await carrera.update({
      facultad_id,
      codigo,
      nombre,
      duracion_semestres,
      estado
    });

    return res.status(200).json({
      message: 'Carrera actualizada exitosamente.',
      carrera
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'El codigo de la carrera ya está en uso por otro registro.'
      });
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'La facultad especificada no existe.'
      });
    }

    return res.status(500).json({
      message: 'Error al actualizar la carrera.',
      error: error.message
    });
  }
};

export const eliminarCarrera = async (req, res) => {
  try {
    const { id } = req.params;
    const carrera = await Carrera.findByPk(id);

    if (!carrera) {
      return res.status(404).json({ message: 'Carrera no encontrada.' });
    }

    await carrera.destroy();
    return res.status(200).json({ message: 'Carrera eliminada correctamente.' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'No se puede eliminar la carrera porque tiene estudiantes o asignaturas asociadas.'
      });
    }

    return res.status(500).json({
      message: 'Error al eliminar la carrera.',
      error: error.message
    });
  }
};
