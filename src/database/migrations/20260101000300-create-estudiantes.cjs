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
    await queryInterface.createTable('estudiantes', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      carrera_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'carreras',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      numero_matricula: {
        type: Sequelize.STRING(30),
        allowNull: false
      },
      identificacion: {
        type: Sequelize.STRING(30),
        allowNull: false
      },
      nombres: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      apellidos: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      correo: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      fecha_nacimiento: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      estado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      ...timestamps(Sequelize)
    });

    await queryInterface.addIndex('estudiantes', ['numero_matricula'], {
      unique: true,
      name: 'uq_estudiantes_numero_matricula'
    });

    await queryInterface.addIndex('estudiantes', ['identificacion'], {
      unique: true,
      name: 'uq_estudiantes_identificacion'
    });

    await queryInterface.addIndex('estudiantes', ['correo'], {
      unique: true,
      name: 'uq_estudiantes_correo'
    });

    await queryInterface.addIndex('estudiantes', ['carrera_id'], {
      name: 'idx_estudiantes_carrera_id'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('estudiantes');
  }
};
