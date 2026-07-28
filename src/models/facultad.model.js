import { DataTypes, Model } from 'sequelize';

class Facultad extends Model {
  static associate(models) {
    this.hasMany(models.Carrera, {
      foreignKey: 'facultad_id',
      as: 'carreras',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  }
}

export const initFacultad = (sequelize) => {
  Facultad.init(
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
      estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'Facultad',
      tableName: 'facultades',
      underscored: true,
      timestamps: true
    }
  );

  return Facultad;
};

export default Facultad;
