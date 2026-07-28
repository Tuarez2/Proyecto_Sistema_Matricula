'use strict';

const timestamps = (Sequelize) => ({
  created_at: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
  updated_at: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
  }
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('carreras', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      facultad_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'facultades',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      codigo: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      nombre: {
        type: Sequelize.STRING(120),
        allowNull: false
      },
      duracion_semestres: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      estado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      ...timestamps(Sequelize)
    });

    await queryInterface.addIndex('carreras', ['codigo'], {
      unique: true,
      name: 'uq_carreras_codigo'
    });

    await queryInterface.addIndex('carreras', ['facultad_id'], {
      name: 'idx_carreras_facultad_id'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('carreras');
  }
};
