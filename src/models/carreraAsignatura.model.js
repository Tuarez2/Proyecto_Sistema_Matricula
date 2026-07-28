import { DataTypes, Model } from 'sequelize';

class CarreraAsignatura extends Model {
  static associate(models) {
    this.belongsTo(models.Carrera, {
      foreignKey: 'carrera_id',
      as: 'carrera',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    this.belongsTo(models.Asignatura, {
      foreignKey: 'asignatura_id',
      as: 'asignatura',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  }
}

export const initCarreraAsignatura = (sequelize) => {
  CarreraAsignatura.init(
    {
      carrera_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true
      },
      asignatura_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true
      },
      semestre: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      obligatoria: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'CarreraAsignatura',
      tableName: 'carrera_asignatura',
      underscored: true,
      timestamps: true
    }
  );

  return CarreraAsignatura;
};

export default CarreraAsignatura;
