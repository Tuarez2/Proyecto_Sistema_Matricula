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
    await queryInterface.createTable('asignaturas', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      codigo: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      nombre: {
        type: Sequelize.STRING(120),
        allowNull: false
      },
      creditos: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      horas_teoricas: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      horas_practicas: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      estado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      ...timestamps(Sequelize)
    });

    await queryInterface.addIndex('asignaturas', ['codigo'], {
      unique: true,
      name: 'uq_asignaturas_codigo'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('asignaturas');
  }
};
