import { DataTypes, Model } from 'sequelize';

class Asignatura extends Model {
  static associate(models) {
    this.belongsToMany(models.Carrera, {
      through: models.CarreraAsignatura,
      foreignKey: 'asignatura_id',
      otherKey: 'carrera_id',
      as: 'carreras'
    });

    this.hasMany(models.Curso, {
      foreignKey: 'asignatura_id',
      as: 'cursos',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  }
}

export const initAsignatura = (sequelize) => {
  Asignatura.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      codigo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
      },
      nombre: {
        type: DataTypes.STRING(120),
        allowNull: false
      },
      creditos: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      horas_teoricas: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      horas_practicas: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'Asignatura',
      tableName: 'asignaturas',
      underscored: true,
      timestamps: true
    }
  );

  return Asignatura;
};

export default Asignatura;
