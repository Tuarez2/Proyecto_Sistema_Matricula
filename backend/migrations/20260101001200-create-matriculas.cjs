'use strict';

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('matriculas', {
      id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true },
      estudiante_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'estudiantes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      curso_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'cursos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      fecha_matricula: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      estado: {
        type: Sequelize.ENUM('inscrita', 'aprobada', 'reprobada', 'retirada', 'anulada'),
        allowNull: false,
        defaultValue: 'inscrita'
      },
      calificacion_final: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      ...timestamps(Sequelize)
    });
    await queryInterface.addIndex('matriculas', ['estudiante_id', 'curso_id'], {
      unique: true,
      name: 'uq_matriculas_estudiante_curso'
    });
    await queryInterface.addIndex('matriculas', ['estudiante_id'], { name: 'idx_matriculas_estudiante_id' });
    await queryInterface.addIndex('matriculas', ['curso_id'], { name: 'idx_matriculas_curso_id' });
    await queryInterface.addIndex('matriculas', ['estado'], { name: 'idx_matriculas_estado' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('matriculas');
  }
};
