'use strict';

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('estudiantes', {
      id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true },
      numero_matricula: { type: Sequelize.STRING(30), allowNull: false },
      nombres: { type: Sequelize.STRING(100), allowNull: false },
      apellidos: { type: Sequelize.STRING(100), allowNull: false },
      identificacion: { type: Sequelize.STRING(20), allowNull: false },
      correo: { type: Sequelize.STRING(150), allowNull: false },
      telefono: { type: Sequelize.STRING(20), allowNull: true },
      fecha_nacimiento: { type: Sequelize.DATEONLY, allowNull: false },
      estado_academico: {
        type: Sequelize.ENUM('activo', 'inactivo', 'suspendido', 'egresado'),
        allowNull: false,
        defaultValue: 'activo'
      },
      nivel_academico_actual: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      carrera_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'carreras', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      ...timestamps(Sequelize)
    });
    await queryInterface.addIndex('estudiantes', ['numero_matricula'], { unique: true, name: 'uq_estudiantes_numero_matricula' });
    await queryInterface.addIndex('estudiantes', ['identificacion'], { unique: true, name: 'uq_estudiantes_identificacion' });
    await queryInterface.addIndex('estudiantes', ['correo'], { unique: true, name: 'uq_estudiantes_correo' });
    await queryInterface.addIndex('estudiantes', ['carrera_id'], { name: 'idx_estudiantes_carrera_id' });
    await queryInterface.addIndex('estudiantes', ['apellidos', 'nombres'], { name: 'idx_estudiantes_apellidos_nombres' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('estudiantes');
  }
};
