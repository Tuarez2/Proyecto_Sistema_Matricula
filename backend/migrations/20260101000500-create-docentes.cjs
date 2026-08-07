'use strict';

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('docentes', {
      id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true },
      identificacion: { type: Sequelize.STRING(20), allowNull: false },
      nombres: { type: Sequelize.STRING(100), allowNull: false },
      apellidos: { type: Sequelize.STRING(100), allowNull: false },
      correo: { type: Sequelize.STRING(150), allowNull: false },
      telefono: { type: Sequelize.STRING(20), allowNull: true },
      especialidad: { type: Sequelize.STRING(150), allowNull: false },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps(Sequelize)
    });
    await queryInterface.addIndex('docentes', ['identificacion'], { unique: true, name: 'uq_docentes_identificacion' });
    await queryInterface.addIndex('docentes', ['correo'], { unique: true, name: 'uq_docentes_correo' });
    await queryInterface.addIndex('docentes', ['apellidos', 'nombres'], { name: 'idx_docentes_apellidos_nombres' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('docentes');
  }
};
