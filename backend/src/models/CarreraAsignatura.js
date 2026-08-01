import { DataTypes, Model } from 'sequelize';

class CarreraAsignatura extends Model {
  static initModel(sequelize) {
    CarreraAsignatura.init(
      {
        carrera_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          primaryKey: true,
          allowNull: false
        },
        asignatura_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          primaryKey: true,
          allowNull: false
        }
      },
      {
        sequelize,
        modelName: 'CarreraAsignatura',
        tableName: 'carrera_asignatura',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return CarreraAsignatura;
  }
}

export default CarreraAsignatura;
