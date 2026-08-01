import { DataTypes, Model } from 'sequelize';

class Sesion extends Model {
  static initModel(sequelize) {
    Sesion.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        usuario_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        },
        refresh_token_hash: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true
        },
        fecha_expiracion: {
          type: DataTypes.DATE,
          allowNull: false
        },
        revocada_en: {
          type: DataTypes.DATE,
          allowNull: true
        },
        direccion_ip: {
          type: DataTypes.STRING(45),
          allowNull: true
        },
        user_agent: {
          type: DataTypes.STRING(255),
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'Sesion',
        tableName: 'sesiones',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return Sesion;
  }
}

export default Sesion;
