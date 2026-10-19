// Prueba rápida de punta a punta contra una API ya levantada.
// Uso: BASE_URL=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run test:smoke
require('dotenv').config();

const BASE = `${process.env.BASE_URL || 'http://localhost:3000'}/api`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@manicuria.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234';

let ok = 0;
let fail = 0;

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* sin body */ }
  return { status: res.status, data };
}

function check(nombre, condicion, extra = '') {
  if (condicion) { ok += 1; console.log(`  OK   ${nombre}`); }
  else { fail += 1; console.log(`  FAIL ${nombre} ${extra}`); }
}

function fechaFutura(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('en-CA');
}

(async () => {
  const sufijo = Date.now();
  const email = `clienta${sufijo}@test.com`;

  console.log('Auth');
  let r = await req('GET', '/health');
  check('health 200', r.status === 200);

  r = await req('GET', '/config');
  check('config pública con horario de atención', r.status === 200 && /^\d{2}:\d{2}$/.test(r.data.hora_apertura) && /^\d{2}:\d{2}$/.test(r.data.hora_cierre));

  r = await req('POST', '/auth/register', { body: { nombre: 'Clienta Test', email, password: 'Clave1234', telefono: '1155551234' } });
  check('registro 201', r.status === 201, JSON.stringify(r.data));
  check('la respuesta no incluye password', r.data && r.data.data && r.data.data.password === undefined);
  const tokenCliente = r.data && r.data.token;

  r = await req('POST', '/auth/register', { body: { nombre: 'Clienta Test', email, password: 'Clave1234' } });
  check('email repetido 409', r.status === 409);

  r = await req('POST', '/auth/register', { body: { nombre: '', email: 'no-es-email', password: '123' } });
  check('registro con datos inválidos 400', r.status === 400 && Array.isArray(r.data.detalles));

  r = await req('POST', '/auth/login', { body: { email, password: 'incorrecta1' } });
  check('login con password incorrecta 401', r.status === 401);

  r = await req('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  check('login admin 200', r.status === 200, JSON.stringify(r.data));
  const tokenAdmin = r.data && r.data.token;

  console.log('Servicios');
  r = await req('GET', '/servicios');
  check('listar servicios público 200', r.status === 200);

  r = await req('POST', '/servicios', { token: tokenCliente, body: { nombre: 'X', precio: 10, duracion_minutos: 30 } });
  check('clienta no puede crear servicio 403', r.status === 403);

  r = await req('POST', '/servicios', { token: tokenAdmin, body: { nombre: `Servicio ${sufijo}`, descripcion: 'Prueba', precio: 9000, duracion_minutos: 60 } });
  check('admin crea servicio 201', r.status === 201, JSON.stringify(r.data));
  const servicioId = r.data && r.data.data && r.data.data.id;

  r = await req('POST', '/servicios', { token: tokenAdmin, body: { nombre: 'Malo', precio: -5, duracion_minutos: 1 } });
  check('servicio inválido 400', r.status === 400);

  r = await req('GET', `/servicios/${servicioId}`);
  check('obtener servicio por id 200', r.status === 200);

  r = await req('PUT', `/servicios/${servicioId}`, { token: tokenAdmin, body: { precio: 9500 } });
  check('actualizar servicio 200', r.status === 200 && Number(r.data.data.precio) === 9500);

  r = await req('GET', '/servicios/999999');
  check('servicio inexistente 404', r.status === 404);

  console.log('Turnos');
  const fecha = fechaFutura(3);

  r = await req('GET', '/turnos');
  check('turnos sin token 401', r.status === 401);

  r = await req('POST', '/turnos', { token: tokenCliente, body: { servicio_id: servicioId, fecha, hora: '10:00', notas: 'Primera vez' } });
  check('clienta reserva turno 201', r.status === 201, JSON.stringify(r.data));
  const turnoId = r.data && r.data.data && r.data.data.id;

  r = await req('POST', '/turnos', { token: tokenAdmin, body: { servicio_id: servicioId, fecha, hora: '10:30' } });
  check('turno que se pisa 409', r.status === 409, JSON.stringify(r.data));

  r = await req('POST', '/turnos', { token: tokenAdmin, body: { servicio_id: servicioId, fecha, hora: '11:00' } });
  check('turno contiguo (sin pisarse) 201', r.status === 201, JSON.stringify(r.data));
  const turnoAdminId = r.data && r.data.data && r.data.data.id;

  r = await req('POST', '/turnos', { token: tokenCliente, body: { servicio_id: servicioId, fecha, hora: '23:00' } });
  check('turno fuera de horario 400', r.status === 400);

  r = await req('POST', '/turnos', { token: tokenCliente, body: { servicio_id: servicioId, fecha: '2020-01-01', hora: '10:00' } });
  check('turno en fecha pasada 400', r.status === 400);

  r = await req('POST', '/turnos', { token: tokenCliente, body: { servicio_id: 999999, fecha, hora: '15:00' } });
  check('turno con servicio inexistente 404', r.status === 404);

  r = await req('GET', '/turnos', { token: tokenCliente });
  check('clienta ve solo sus turnos', r.status === 200 && r.data.data.every((t) => t.cliente.email === email));

  r = await req('GET', `/turnos/${turnoAdminId}`, { token: tokenCliente });
  check('clienta no ve turno ajeno 403', r.status === 403);

  r = await req('PUT', `/turnos/${turnoId}`, { token: tokenCliente, body: { estado: 'confirmado' } });
  check('clienta no puede confirmar 403', r.status === 403);

  r = await req('PUT', `/turnos/${turnoId}`, { token: tokenAdmin, body: { estado: 'confirmado' } });
  check('admin confirma turno 200', r.status === 200 && r.data.data.estado === 'confirmado');

  r = await req('PUT', `/turnos/${turnoId}`, { token: tokenCliente, body: { estado: 'cancelado' } });
  check('clienta cancela su turno 200', r.status === 200 && r.data.data.estado === 'cancelado');

  r = await req('DELETE', `/servicios/${servicioId}`, { token: tokenAdmin });
  check('no se borra servicio con turnos 409', r.status === 409, JSON.stringify(r.data));

  r = await req('DELETE', `/turnos/${turnoId}`, { token: tokenCliente });
  check('clienta elimina su turno 200', r.status === 200);

  r = await req('DELETE', `/turnos/${turnoId}`, { token: tokenCliente });
  check('eliminar turno inexistente 404', r.status === 404);

  r = await req('DELETE', `/turnos/${turnoAdminId}`, { token: tokenAdmin });
  check('admin elimina turno 200', r.status === 200);

  console.log('Usuarios');
  r = await req('GET', '/usuarios', { token: tokenCliente });
  check('clienta no lista usuarios 403', r.status === 403);

  r = await req('GET', '/usuarios', { token: tokenAdmin });
  check('admin lista usuarios 200', r.status === 200);

  const clienteId = (await req('GET', '/auth/me', { token: tokenCliente })).data.data.id;
  r = await req('PUT', `/usuarios/${clienteId}`, { token: tokenCliente, body: { rol: 'admin' } });
  check('clienta no puede hacerse admin 403', r.status === 403);

  r = await req('PUT', `/usuarios/${clienteId}`, { token: tokenCliente, body: { telefono: '1166667777' } });
  check('clienta actualiza su perfil 200', r.status === 200);

  r = await req('DELETE', `/servicios/${servicioId}`, { token: tokenAdmin });
  check('admin elimina servicio sin turnos 200', r.status === 200);

  r = await req('DELETE', `/usuarios/${clienteId}`, { token: tokenAdmin });
  check('admin elimina usuario 200', r.status === 200);

  r = await req('GET', '/ruta-inexistente');
  check('ruta inexistente 404', r.status === 404);

  console.log(`\nResultado: ${ok} OK, ${fail} fallaron`);
  process.exit(fail ? 1 : 0);
})();
