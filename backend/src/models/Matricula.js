import { DataTypes, Model } from 'sequelize';

import { ENROLLMENT_STATUS } from '../constants/domain.constants.js';

class Matricula extends Model {
  static initModel(sequelize) {
    Matricula.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        estudiante_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        },
        curso_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        },
        fecha_matricula: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        estado: {
          type: DataTypes.ENUM(...Object.values(ENROLLMENT_STATUS)),
          allowNull: false,
          defaultValue: ENROLLMENT_STATUS.ENROLLED
        },
        calificacion_final: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'Matricula',
        tableName: 'matriculas',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
          {
            unique: true,
            fields: ['estudiante_id', 'curso_id'],
            name: 'uq_matriculas_estudiante_curso'
          }
        ]
      }
    );

    return Matricula;
  }
}

export default Matricula;
