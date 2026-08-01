'use strict';

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sesiones', {
      id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true },
      usuario_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      refresh_token_hash: { type: Sequelize.STRING(255), allowNull: false },
      fecha_expiracion: { type: Sequelize.DATE, allowNull: false },
      revocada_en: { type: Sequelize.DATE, allowNull: true },
      direccion_ip: { type: Sequelize.STRING(45), allowNull: true },
      user_agent: { type: Sequelize.STRING(255), allowNull: true },
      ...timestamps(Sequelize)
    });
    await queryInterface.addIndex('sesiones', ['refresh_token_hash'], { unique: true, name: 'uq_sesiones_refresh_token_hash' });
    await queryInterface.addIndex('sesiones', ['usuario_id'], { name: 'idx_sesiones_usuario_id' });
    await queryInterface.addIndex('sesiones', ['fecha_expiracion'], { name: 'idx_sesiones_fecha_expiracion' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sesiones');
  }
};
