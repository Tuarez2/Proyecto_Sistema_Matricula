import { DataTypes, Model } from 'sequelize';

class Asignatura extends Model {
  static initModel(sequelize) {
    Asignatura.init(
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
        creditos: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        },
        nivel_academico: {
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
        modelName: 'Asignatura',
        tableName: 'asignaturas',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return Asignatura;
  }
}

export default Asignatura;
