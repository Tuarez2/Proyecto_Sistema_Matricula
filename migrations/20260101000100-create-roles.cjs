'use strict';

const timestamps = (Sequelize) => ({
  created_at: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
  updated_at: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
  }
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true },
      codigo: { type: Sequelize.STRING(30), allowNull: false },
      nombre: { type: Sequelize.STRING(80), allowNull: false },
      descripcion: { type: Sequelize.STRING(255), allowNull: true },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps(Sequelize)
    });
    await queryInterface.addIndex('roles', ['codigo'], { unique: true, name: 'uq_roles_codigo' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('roles');
  }
};
