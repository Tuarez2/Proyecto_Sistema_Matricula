'use strict';

const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const ADMIN_ROLE_CODE = 'ADMIN';
const REQUIRED_ADMIN_VARIABLES = [
  'INITIAL_ADMIN_FIRST_NAME',
  'INITIAL_ADMIN_LAST_NAME',
  'INITIAL_ADMIN_EMAIL',
  'INITIAL_ADMIN_PASSWORD'
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const missingVariables = REQUIRED_ADMIN_VARIABLES.filter((name) => !process.env[name]);

    if (missingVariables.length > 0) {
      throw new Error(`Missing required admin seed variables: ${missingVariables.join(', ')}`);
    }

    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;

    const [existingUser] = await queryInterface.sequelize.query(
      'SELECT id FROM usuarios WHERE correo = :correo LIMIT 1',
      {
        replacements: { correo: adminEmail },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingUser) {
      return;
    }

    const [adminRole] = await queryInterface.sequelize.query(
      'SELECT id FROM roles WHERE codigo = :codigo LIMIT 1',
      {
        replacements: { codigo: ADMIN_ROLE_CODE },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (!adminRole) {
      throw new Error('ADMIN role does not exist. Run role seeders first.');
    }

    const passwordHash = await bcrypt.hash(process.env.INITIAL_ADMIN_PASSWORD, 12);
    const now = new Date();

    await queryInterface.bulkInsert('usuarios', [
      {
        nombres: process.env.INITIAL_ADMIN_FIRST_NAME,
        apellidos: process.env.INITIAL_ADMIN_LAST_NAME,
        correo: adminEmail,
        password_hash: passwordHash,
        estado: 'activo',
        rol_id: adminRole.id,
        estudiante_id: null,
        docente_id: null,
        debe_cambiar_password: true,
        ultimo_acceso: null,
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', {
      correo: process.env.INITIAL_ADMIN_EMAIL
    });
  }
};
