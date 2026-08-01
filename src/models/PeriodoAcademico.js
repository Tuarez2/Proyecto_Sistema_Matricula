import { DataTypes, Model } from 'sequelize';

import { ACADEMIC_PERIOD_STATUS } from '../constants/domain.constants.js';

class PeriodoAcademico extends Model {
  static initModel(sequelize) {
    PeriodoAcademico.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        codigo: {
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true
        },
        nombre: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        fecha_inicio: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        fecha_fin: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        fecha_inicio_matricula: {
          type: DataTypes.DATE,
          allowNull: false
        },
        fecha_fin_matricula: {
          type: DataTypes.DATE,
          allowNull: false
        },
        estado: {
          type: DataTypes.ENUM(...Object.values(ACADEMIC_PERIOD_STATUS)),
          allowNull: false,
          defaultValue: ACADEMIC_PERIOD_STATUS.PLANNED
        }
      },
      {
        sequelize,
        modelName: 'PeriodoAcademico',
        tableName: 'periodos_academicos',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return PeriodoAcademico;
  }
}

export default PeriodoAcademico;
