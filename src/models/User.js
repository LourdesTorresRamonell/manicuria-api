const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    rol: {
      type: DataTypes.ENUM('cliente', 'admin'),
      allowNull: false,
      defaultValue: 'cliente',
    },
  },
  {
    tableName: 'usuarios',
    hooks: {
      // Hashea la contraseña antes de guardar (alta y cambio de contraseña)
      beforeSave: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, ROUNDS);
        }
      },
    },
  }
);

User.prototype.validarPassword = function validarPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

// Nunca devolver el hash en las respuestas
User.prototype.toJSON = function toJSON() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
