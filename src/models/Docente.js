import { DataTypes, Model } from 'sequelize';

class Docente extends Model {
  static initModel(sequelize) {
    Docente.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true
        },
        identificacion: {
          type: DataTypes.STRING(20),
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
          unique: true
        },
        telefono: {
          type: DataTypes.STRING(20),
          allowNull: true
        },
        especialidad: {
          type: DataTypes.STRING(150),
          allowNull: false
        },
        activo: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        }
      },
      {
        sequelize,
        modelName: 'Docente',
        tableName: 'docentes',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    );

    return Docente;
  }
}

export default Docente;
