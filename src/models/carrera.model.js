import { DataTypes, Model } from 'sequelize';

class Carrera extends Model {
  static associate(models) {
    this.belongsTo(models.Facultad, {
      foreignKey: 'facultad_id',
      as: 'facultad',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    this.hasMany(models.Estudiante, {
      foreignKey: 'carrera_id',
      as: 'estudiantes',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    this.belongsToMany(models.Asignatura, {
      through: models.CarreraAsignatura,
      foreignKey: 'carrera_id',
      otherKey: 'asignatura_id',
      as: 'asignaturas'
    });
  }
}

export const initCarrera = (sequelize) => {
  Carrera.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      facultad_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
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
      duracion_semestres: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'Carrera',
      tableName: 'carreras',
      underscored: true,
      timestamps: true
    }
  );

  return Carrera;
};

export default Carrera;
