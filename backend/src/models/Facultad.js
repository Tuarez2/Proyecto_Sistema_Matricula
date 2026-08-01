import { DataTypes, Model } from 'sequelize';

class Facultad extends Model {
  static initModel(sequelize) {
    Facultad.init(
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
          type: DataTypes.STRING(120),
          allowNull: false,
          unique: true
        },
        activo: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        }
      },
      {
        sequelize,
        modelName: 'Facultad',
        tableName: 'facultades',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return Facultad;
  }
}

export default Facultad;
