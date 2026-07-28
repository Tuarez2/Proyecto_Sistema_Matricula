import { DataTypes, Model } from 'sequelize';

class Estudiante extends Model {
  static associate(models) {
    this.belongsTo(models.Carrera, {
      foreignKey: 'carrera_id',
      as: 'carrera',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    this.belongsToMany(models.Curso, {
      through: models.Matricula,
      foreignKey: 'estudiante_id',
      otherKey: 'curso_id',
      as: 'cursos'
    });
  }
}

export const initEstudiante = (sequelize) => {
  Estudiante.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      carrera_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      numero_matricula: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true
      },
      identificacion: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true
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
        unique: true,
        validate: {
          isEmail: true
        }
      },
      fecha_nacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'Estudiante',
      tableName: 'estudiantes',
      underscored: true,
      timestamps: true
    }
  );

  return Estudiante;
};

export default Estudiante;
