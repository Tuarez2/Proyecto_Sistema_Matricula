'use strict';

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('asignaturas', {
      id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true },
      codigo: { type: Sequelize.STRING(20), allowNull: false },
      nombre: { type: Sequelize.STRING(150), allowNull: false },
      creditos: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      nivel_academico: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps(Sequelize)
    });
    await queryInterface.addIndex('asignaturas', ['codigo'], { unique: true, name: 'uq_asignaturas_codigo' });
    await queryInterface.addIndex('asignaturas', ['nombre'], { name: 'idx_asignaturas_nombre' });
    await queryInterface.addIndex('asignaturas', ['nivel_academico'], { name: 'idx_asignaturas_nivel_academico' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('asignaturas');
  }
};
