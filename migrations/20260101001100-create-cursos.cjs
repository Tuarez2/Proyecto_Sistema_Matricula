'use strict';

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cursos', {
      id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true },
      paralelo: { type: Sequelize.STRING(10), allowNull: false },
      aula: { type: Sequelize.STRING(50), allowNull: false },
      horario: { type: Sequelize.STRING(150), allowNull: false },
      cupo_maximo: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      estado: { type: Sequelize.ENUM('abierto', 'cerrado', 'cancelado'), allowNull: false, defaultValue: 'abierto' },
      asignatura_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'asignaturas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      docente_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'docentes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      periodo_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'periodos_academicos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      ...timestamps(Sequelize)
    });
    await queryInterface.addIndex('cursos', ['periodo_id', 'asignatura_id', 'paralelo'], {
      unique: true,
      name: 'uq_cursos_periodo_asignatura_paralelo'
    });
    await queryInterface.addIndex('cursos', ['asignatura_id'], { name: 'idx_cursos_asignatura_id' });
    await queryInterface.addIndex('cursos', ['docente_id'], { name: 'idx_cursos_docente_id' });
    await queryInterface.addIndex('cursos', ['periodo_id'], { name: 'idx_cursos_periodo_id' });
    await queryInterface.addIndex('cursos', ['estado'], { name: 'idx_cursos_estado' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cursos');
  }
};
