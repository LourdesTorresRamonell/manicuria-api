const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Servicio = sequelize.define(
  'Servicio',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    descripcion: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    duracion_minutos: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'servicios',
  }
);

module.exports = Servicio;
