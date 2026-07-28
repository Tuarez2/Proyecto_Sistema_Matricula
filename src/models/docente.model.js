import { DataTypes, Model } from 'sequelize';

class Docente extends Model {
  static associate(models) {
    this.hasMany(models.Curso, {
      foreignKey: 'docente_id',
      as: 'cursos',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  }
}

export const initDocente = (sequelize) => {
  Docente.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
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
      titulo: {
        type: DataTypes.STRING(120),
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
      modelName: 'Docente',
      tableName: 'docentes',
      underscored: true,
      timestamps: true
    }
  );

  return Docente;
};

export default Docente;
