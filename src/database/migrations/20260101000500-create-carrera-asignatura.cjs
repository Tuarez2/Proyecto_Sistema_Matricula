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
    await queryInterface.createTable('carrera_asignatura', {
      carrera_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'carreras',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      asignatura_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'asignaturas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      semestre: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      obligatoria: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      ...timestamps(Sequelize)
    });

    await queryInterface.addConstraint('carrera_asignatura', {
      fields: ['carrera_id', 'asignatura_id'],
      type: 'primary key',
      name: 'pk_carrera_asignatura'
    });

    await queryInterface.addIndex('carrera_asignatura', ['asignatura_id'], {
      name: 'idx_carrera_asignatura_asignatura_id'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('carrera_asignatura');
  }
};
