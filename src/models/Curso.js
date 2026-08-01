import { DataTypes, Model } from 'sequelize';

import { COURSE_STATUS } from '../constants/domain.constants.js';

class Curso extends Model {
  static initModel(sequelize) {
    Curso.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        paralelo: {
          type: DataTypes.STRING(10),
          allowNull: false
        },
        aula: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        horario: {
          type: DataTypes.STRING(150),
          allowNull: false
        },
        cupo_maximo: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        },
        estado: {
          type: DataTypes.ENUM(...Object.values(COURSE_STATUS)),
          allowNull: false,
          defaultValue: COURSE_STATUS.OPEN
        },
        asignatura_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        },
        docente_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        },
        periodo_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        }
      },
      {
        sequelize,
        modelName: 'Curso',
        tableName: 'cursos',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
          {
            unique: true,
            fields: ['periodo_id', 'asignatura_id', 'paralelo'],
            name: 'uq_cursos_periodo_asignatura_paralelo'
          }
        ]
      }
    );

    return Curso;
  }
}

export default Curso;
