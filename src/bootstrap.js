const { User, Servicio } = require('./models');

const SERVICIOS_DEMO = [
  { nombre: 'Manicura clásica', descripcion: 'Limado, cutículas y esmaltado tradicional.', precio: 8000, duracion_minutos: 45 },
  { nombre: 'Esmaltado semipermanente', descripcion: 'Esmaltado de larga duración con cabina UV/LED.', precio: 12000, duracion_minutos: 60 },
  { nombre: 'Esculpidas en gel', descripcion: 'Uñas esculpidas con gel y diseño a elección.', precio: 22000, duracion_minutos: 120 },
  { nombre: 'Nail art', descripcion: 'Diseños y decoración personalizada.', precio: 5000, duracion_minutos: 30 },
  { nombre: 'Retiro de esmaltado', descripcion: 'Retiro seguro de semipermanente o esculpidas.', precio: 4000, duracion_minutos: 30 },
];

// Crea la administradora inicial si no existe (útil en Render, donde no hay terminal)
async function asegurarAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existente = await User.findOne({ where: { email } });
  if (existente) return;

  await User.create({
    nombre: process.env.ADMIN_NOMBRE || 'Administradora',
    email,
    password,
    rol: 'admin',
  });
  console.log(`Administradora creada: ${email}`);
}

// Carga servicios de ejemplo si la tabla está vacía
async function cargarServiciosDemo() {
  if (String(process.env.SEED_DEMO_DATA).toLowerCase() !== 'true') return;
  if ((await Servicio.count()) > 0) return;

  await Servicio.bulkCreate(SERVICIOS_DEMO);
  console.log(`Servicios de ejemplo cargados (${SERVICIOS_DEMO.length})`);
}

module.exports = { asegurarAdmin, cargarServiciosDemo };
