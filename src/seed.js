// Uso: npm run seed
// Crea las tablas (si faltan), la administradora inicial y servicios de ejemplo.
require('dotenv').config();

const { sequelize } = require('./models');
const { asegurarAdmin, cargarServiciosDemo } = require('./bootstrap');

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    process.env.SEED_DEMO_DATA = 'true';
    await asegurarAdmin();
    await cargarServiciosDemo();

    console.log('Seed finalizado');
    await sequelize.close();
  } catch (err) {
    console.error('Error en el seed:', err.message);
    process.exit(1);
  }
})();
