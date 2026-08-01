import { DataTypes, Model } from 'sequelize';

import { USER_STATUS } from '../constants/domain.constants.js';

class Usuario extends Model {
  static initModel(sequelize) {
    Usuario.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        nombres: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        apellidos: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        correo: {
          type: DataTypes.STRING(150),
          allowNull: false,
          unique: true
        },
        password_hash: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        estado: {
          type: DataTypes.ENUM(...Object.values(USER_STATUS)),
          allowNull: false,
          defaultValue: USER_STATUS.ACTIVE
        },
        rol_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        },
        estudiante_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          unique: true
        },
        docente_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          unique: true
        },
        debe_cambiar_password: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        ultimo_acceso: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'Usuario',
        tableName: 'usuarios',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return Usuario;
  }
}

export default Usuario;
