'use strict';

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('facultades', {
      id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true },
      codigo: { type: Sequelize.STRING(20), allowNull: false },
      nombre: { type: Sequelize.STRING(120), allowNull: false },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps(Sequelize)
    });
    await queryInterface.addIndex('facultades', ['codigo'], { unique: true, name: 'uq_facultades_codigo' });
    await queryInterface.addIndex('facultades', ['nombre'], { unique: true, name: 'uq_facultades_nombre' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('facultades');
  }
};
