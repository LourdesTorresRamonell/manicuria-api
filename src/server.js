require('dotenv').config();
process.env.TZ = process.env.TZ || 'America/Argentina/Buenos_Aires';

const app = require('./app');
const { sequelize } = require('./models');
const { asegurarAdmin, cargarServiciosDemo } = require('./bootstrap');

const PORT = process.env.PORT || 3000;

async function iniciar() {
  if (!process.env.JWT_SECRET) {
    console.error('Falta JWT_SECRET en las variables de entorno (.env)');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos OK');

    if (String(process.env.DB_SYNC).toLowerCase() === 'true') {
      await sequelize.sync();
      console.log('Tablas sincronizadas');
    }

    await asegurarAdmin();
    await cargarServiciosDemo();

    app.listen(PORT, () => {
      console.log(`API de manicuría escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
}

iniciar();
