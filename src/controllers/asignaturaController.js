import Asignatura from "../models/asignatura.model.js";

export const crearAsignatura = async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      creditos,
      horas_teoricas,
      horas_practicas,
      estado,
    } = req.body;

    if (!codigo || !nombre || creditos === undefined) {
      return res.status(400).json({
        message: "Los campos codigo, nombre y creditos son obligatorios.",
      });
    }

    const nuevaAsignatura = await Asignatura.create({
      codigo,
      nombre,
      creditos,
      horas_teoricas: horas_teoricas ?? 0,
      horas_practicas: horas_practicas ?? 0,
      estado: estado !== undefined ? estado : true,
    });

    return res.status(201).json(nuevaAsignatura);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "El codigo de asignatura ya está registrado.",
      });
    }

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Datos de asignatura inválidos.",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Error interno al intentar crear la asignatura.",
      error: error.message,
    });
  }
};

export const obtenerAsignaturas = async (req, res) => {
  try {
    const asignaturas = await Asignatura.findAll({
      include: [{ association: "carreras" }, { association: "cursos" }],
    });
    return res.status(200).json(asignaturas);
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener la lista de asignaturas.",
      error: error.message,
    });
  }
};

export const obtenerAsignaturaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const asignatura = await Asignatura.findByPk(id, {
      include: [{ association: "carreras" }, { association: "cursos" }],
    });

    if (!asignatura) {
      return res.status(404).json({ message: "Asignatura no encontrada." });
    }

    return res.status(200).json(asignatura);
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener la asignatura.",
      error: error.message,
    });
  }
};

export const actualizarAsignatura = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      nombre,
      creditos,
      horas_teoricas,
      horas_practicas,
      estado,
    } = req.body;

    const asignatura = await Asignatura.findByPk(id);
    if (!asignatura) {
      return res.status(404).json({ message: "Asignatura no encontrada." });
    }

    await asignatura.update({
      codigo,
      nombre,
      creditos,
      horas_teoricas,
      horas_practicas,
      estado,
    });

    return res.status(200).json({
      message: "Asignatura actualizada exitosamente.",
      asignatura,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "El codigo de asignatura ya está en uso por otro registro.",
      });
    }

    return res.status(500).json({
      message: "Error al actualizar la asignatura.",
      error: error.message,
    });
  }
};

export const eliminarAsignatura = async (req, res) => {
  try {
    const { id } = req.params;
    const asignatura = await Asignatura.findByPk(id);

    if (!asignatura) {
      return res.status(404).json({ message: "Asignatura no encontrada." });
    }

    await asignatura.destroy();
    return res
      .status(200)
      .json({ message: "Asignatura eliminada correctamente." });
  } catch (error) {
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        message:
          "No se puede eliminar la asignatura porque está asociada a cursos o carreras.",
      });
    }

    return res.status(500).json({
      message: "Error al eliminar la asignatura.",
      error: error.message,
    });
  }
};
