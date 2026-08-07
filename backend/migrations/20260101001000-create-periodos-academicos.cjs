'use strict';

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('periodos_academicos', {
      id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true },
      codigo: { type: Sequelize.STRING(20), allowNull: false },
      nombre: { type: Sequelize.STRING(100), allowNull: false },
      fecha_inicio: { type: Sequelize.DATEONLY, allowNull: false },
      fecha_fin: { type: Sequelize.DATEONLY, allowNull: false },
      fecha_inicio_matricula: { type: Sequelize.DATE, allowNull: false },
      fecha_fin_matricula: { type: Sequelize.DATE, allowNull: false },
      estado: {
        type: Sequelize.ENUM('planificado', 'matricula_abierta', 'en_curso', 'cerrado'),
        allowNull: false,
        defaultValue: 'planificado'
      },
      ...timestamps(Sequelize)
    });
    await queryInterface.addIndex('periodos_academicos', ['codigo'], { unique: true, name: 'uq_periodos_academicos_codigo' });
    await queryInterface.addIndex('periodos_academicos', ['estado'], { name: 'idx_periodos_academicos_estado' });
    await queryInterface.addIndex('periodos_academicos', ['fecha_inicio', 'fecha_fin'], { name: 'idx_periodos_academicos_fechas' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('periodos_academicos');
  }
};
