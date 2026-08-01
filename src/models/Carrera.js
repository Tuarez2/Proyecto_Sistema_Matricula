import { DataTypes, Model } from 'sequelize';

class Carrera extends Model {
  static initModel(sequelize) {
    Carrera.init(
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
          type: DataTypes.STRING(150),
          allowNull: false
        },
        duracion_semestres: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        },
        facultad_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        },
        activo: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        }
      },
      {
        sequelize,
        modelName: 'Carrera',
        tableName: 'carreras',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return Carrera;
  }
}

export default Carrera;
