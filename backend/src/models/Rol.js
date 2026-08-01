import { DataTypes, Model } from 'sequelize';

class Rol extends Model {
  static initModel(sequelize) {
    Rol.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        codigo: {
          type: DataTypes.STRING(30),
          allowNull: false,
          unique: true
        },
        nombre: {
          type: DataTypes.STRING(80),
          allowNull: false
        },
        descripcion: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        activo: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        }
      },
      {
        sequelize,
        modelName: 'Rol',
        tableName: 'roles',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return Rol;
  }
}

export default Rol;
