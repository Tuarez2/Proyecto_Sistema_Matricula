import { DataTypes, Model } from 'sequelize';

class Curso extends Model {
  static associate(models) {
    // ⚠️ COMENTADO: Asignatura aún no está cargada en index.js
    /*
    if (models.Asignatura) {
      this.belongsTo(models.Asignatura, {
        foreignKey: 'asignatura_id',
        as: 'asignatura',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
    }
    */

    // ✅ ACTIVO: Docente ya está cargado e inicializado
    if (models.Docente) {
      this.belongsTo(models.Docente, {
        foreignKey: 'docente_id',
        as: 'docente',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
    }

    // ⚠️ COMENTADO: PeriodoAcademico aún no está cargado en index.js
    /*
    if (models.PeriodoAcademico) {
      this.belongsTo(models.PeriodoAcademico, {
        foreignKey: 'periodo_id',
        as: 'periodo',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
    }
    */

    // ✅ AJUSTADO: Si quieres relacionar con Estudiante sin usar el modelo Matricula
    if (models.Estudiante) {
      this.belongsToMany(models.Estudiante, {
        through: 'matriculas', // Se usa el nombre de la tabla directamente como string
        foreignKey: 'curso_id',
        otherKey: 'estudiante_id',
        as: 'estudiantes'
      });
    }
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