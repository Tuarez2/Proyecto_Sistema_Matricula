import { DataTypes, Model } from 'sequelize';

class Matricula extends Model {
  static associate(models) {
    this.belongsTo(models.Estudiante, {
      foreignKey: 'estudiante_id',
      as: 'estudiante',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    this.belongsTo(models.Curso, {
      foreignKey: 'curso_id',
      as: 'curso',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  }
}

export const initMatricula = (sequelize) => {
  Matricula.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      estudiante_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      curso_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      fecha_matricula: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      estado: {
        type: DataTypes.ENUM('activa', 'retirada', 'finalizada'),
        allowNull: false,
        defaultValue: 'activa'
      }
    },
    {
      sequelize,
      modelName: 'Matricula',
      tableName: 'matriculas',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['estudiante_id', 'curso_id'],
          name: 'uq_matriculas_estudiante_curso'
        }
      ]
    }
  );

  return Matricula;
};

export default Matricula;
