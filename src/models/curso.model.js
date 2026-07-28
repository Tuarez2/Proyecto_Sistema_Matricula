import { DataTypes, Model } from 'sequelize';

class Curso extends Model {
  static associate(models) {
    this.belongsTo(models.Asignatura, {
      foreignKey: 'asignatura_id',
      as: 'asignatura',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    this.belongsTo(models.Docente, {
      foreignKey: 'docente_id',
      as: 'docente',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    this.belongsTo(models.PeriodoAcademico, {
      foreignKey: 'periodo_id',
      as: 'periodo',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    this.belongsToMany(models.Estudiante, {
      through: models.Matricula,
      foreignKey: 'curso_id',
      otherKey: 'estudiante_id',
      as: 'estudiantes'
    });
  }
}

export const initCurso = (sequelize) => {
  Curso.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      periodo_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      asignatura_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      docente_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      paralelo: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      cupo_maximo: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      horario: {
        type: DataTypes.STRING(120),
        allowNull: true
      },
      aula: {
        type: DataTypes.STRING(50),
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
      modelName: 'Curso',
      tableName: 'cursos',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['periodo_id', 'asignatura_id', 'paralelo'],
          name: 'uq_cursos_periodo_asignatura_paralelo'
        }
      ]
    }
  );

  return Curso;
};

export default Curso;
