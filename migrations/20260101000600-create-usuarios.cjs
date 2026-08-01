'use strict';

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true },
      nombres: { type: Sequelize.STRING(100), allowNull: false },
      apellidos: { type: Sequelize.STRING(100), allowNull: false },
      correo: { type: Sequelize.STRING(150), allowNull: false },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      estado: { type: Sequelize.ENUM('activo', 'bloqueado', 'inactivo'), allowNull: false, defaultValue: 'activo' },
      rol_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      estudiante_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'estudiantes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      docente_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'docentes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      debe_cambiar_password: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      ultimo_acceso: { type: Sequelize.DATE, allowNull: true },
      ...timestamps(Sequelize)
    });
    await queryInterface.addIndex('usuarios', ['correo'], { unique: true, name: 'uq_usuarios_correo' });
    await queryInterface.addIndex('usuarios', ['estudiante_id'], { unique: true, name: 'uq_usuarios_estudiante_id' });
    await queryInterface.addIndex('usuarios', ['docente_id'], { unique: true, name: 'uq_usuarios_docente_id' });
    await queryInterface.addIndex('usuarios', ['rol_id'], { name: 'idx_usuarios_rol_id' });
    await queryInterface.addIndex('usuarios', ['apellidos', 'nombres'], { name: 'idx_usuarios_apellidos_nombres' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('usuarios');
  }
};
