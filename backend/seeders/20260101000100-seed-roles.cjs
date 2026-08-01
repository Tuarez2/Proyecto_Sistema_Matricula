'use strict';

const ROLE_CODES = {
  ADMIN: 'ADMIN',
  ENROLLMENT_MANAGER: 'GESTOR_MATRICULA',
  STUDENT: 'ESTUDIANTE',
  TEACHER: 'DOCENTE'
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = [
      {
        codigo: ROLE_CODES.ADMIN,
        nombre: 'Administrador',
        descripcion: 'Acceso administrativo completo al sistema.'
      },
      {
        codigo: ROLE_CODES.ENROLLMENT_MANAGER,
        nombre: 'Gestor de matricula',
        descripcion: 'Gestion operativa de procesos de matricula.'
      },
      {
        codigo: ROLE_CODES.STUDENT,
        nombre: 'Estudiante',
        descripcion: 'Acceso para estudiantes matriculados.'
      },
      {
        codigo: ROLE_CODES.TEACHER,
        nombre: 'Docente',
        descripcion: 'Acceso para docentes.'
      }
    ];

    const existingRoles = await queryInterface.sequelize.query(
      'SELECT codigo FROM roles WHERE codigo IN (:codigos)',
      {
        replacements: { codigos: roles.map((role) => role.codigo) },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    const existingCodes = existingRoles.map((role) => role.codigo);
    const now = new Date();
    const rolesToInsert = roles
      .filter((role) => !existingCodes.includes(role.codigo))
      .map((role) => ({
        ...role,
        activo: true,
        created_at: now,
        updated_at: now
      }));

    if (rolesToInsert.length > 0) {
      await queryInterface.bulkInsert('roles', rolesToInsert);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', {
      codigo: {
        [Sequelize.Op.in]: Object.values(ROLE_CODES)
      }
    });
  }
};
