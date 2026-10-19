const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ESTADOS = ['pendiente', 'confirmado', 'cancelado', 'completado'];

const Turno = sequelize.define(
  'Turno',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    servicio_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hora: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM(...ESTADOS),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    notas: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    tableName: 'turnos',
  }
);

Turno.ESTADOS = ESTADOS;

module.exports = Turno;
