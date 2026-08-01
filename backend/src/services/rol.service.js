import { Rol } from '../models/index.js';

const atributosRol = ['id', 'codigo', 'nombre', 'descripcion', 'activo'];

export const listarRoles = async () =>
  Rol.findAll({
    where: { activo: true },
    attributes: atributosRol,
    order: [
      ['nombre', 'ASC'],
      ['id', 'ASC']
    ],
    raw: true
  });

export default {
  listarRoles
};
