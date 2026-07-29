import { DataTypes, Model } from 'sequelize';

import { ACADEMIC_STATUS } from '../constants/domain.constants.js';

class Estudiante extends Model {
  static initModel(sequelize) {
    Estudiante.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        numero_matricula: {
          type: DataTypes.STRING(30),
          allowNull: false,
          unique: true
        },
        nombres: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        apellidos: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        identificacion: {
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true
        },
        correo: {
          type: DataTypes.STRING(150),
          allowNull: false,
          unique: true
        },
        telefono: {
          type: DataTypes.STRING(20),
          allowNull: true
        },
        fecha_nacimiento: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        estado_academico: {
          type: DataTypes.ENUM(...Object.values(ACADEMIC_STATUS)),
          allowNull: false,
          defaultValue: ACADEMIC_STATUS.ACTIVE
        },
        nivel_academico_actual: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        },
        carrera_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        }
      },
      {
        sequelize,
        modelName: 'Estudiante',
        tableName: 'estudiantes',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return Estudiante;
  }
}

export default Estudiante;
