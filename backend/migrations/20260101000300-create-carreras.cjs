'use strict';

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('carreras', {
      id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true },
      codigo: { type: Sequelize.STRING(20), allowNull: false },
      nombre: { type: Sequelize.STRING(150), allowNull: false },
      duracion_semestres: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      facultad_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'facultades', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps(Sequelize)
    });
    await queryInterface.addIndex('carreras', ['codigo'], { unique: true, name: 'uq_carreras_codigo' });
    await queryInterface.addIndex('carreras', ['facultad_id'], { name: 'idx_carreras_facultad_id' });
    await queryInterface.addIndex('carreras', ['nombre'], { name: 'idx_carreras_nombre' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('carreras');
  }
};
