const sequelize = require('../config/database');
const User = require('./User');
const Servicio = require('./Servicio');
const Turno = require('./Turno');

// Un usuario tiene muchos turnos
User.hasMany(Turno, { foreignKey: 'usuario_id', as: 'turnos', onDelete: 'CASCADE' });
Turno.belongsTo(User, { foreignKey: 'usuario_id', as: 'cliente' });

// Un servicio tiene muchos turnos (no se puede borrar si tiene turnos asociados)
Servicio.hasMany(Turno, { foreignKey: 'servicio_id', as: 'turnos', onDelete: 'RESTRICT' });
Turno.belongsTo(Servicio, { foreignKey: 'servicio_id', as: 'servicio' });

module.exports = { sequelize, User, Servicio, Turno };
