import { DataTypes, Model } from 'sequelize';

class PeriodoAcademico extends Model {
  static associate(models) {
    this.hasMany(models.Curso, {
      foreignKey: 'periodo_id',
      as: 'cursos',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  }
}

export const initPeriodoAcademico = (sequelize) => {
  PeriodoAcademico.init(
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
      fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      fecha_fin: {
        type: DataTypes.DATEONLY,
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
      modelName: 'PeriodoAcademico',
      tableName: 'periodos_academicos',
      underscored: true,
      timestamps: true
    }
  );

  return PeriodoAcademico;
};

export default PeriodoAcademico;
