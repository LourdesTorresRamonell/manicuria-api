// Frontend de la manicuría. Se sirve desde el mismo servidor, por eso las rutas son relativas (/api/...).
const API = '/api';

const $ = (sel, root = document) => root.querySelector(sel);

// localStorage puede fallar (modo privado, etc.): lo envolvemos para que la app siga andando
const almacen = {
  leer(clave) { try { return localStorage.getItem(clave); } catch (e) { return null; } },
  guardar(clave, valor) { try { localStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento */ } },
  borrar(clave) { try { localStorage.removeItem(clave); } catch (e) { /* sin almacenamiento */ } },
};

const estado = {
  token: almacen.leer('token'),
  usuario: null,
  servicios: [],
  config: { hora_apertura: '09:00', hora_cierre: '20:00' },
};

// ---------- Utilidades ----------
function mostrarMensaje(texto, tipo = 'ok') {
  const el = $('#mensaje');
  el.textContent = texto;
  el.className = `mensaje ${tipo}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  clearTimeout(mostrarMensaje.timer);
  mostrarMensaje.timer = setTimeout(() => el.classList.add('hidden'), 5000);
}

async function api(metodo, ruta, body) {
  const res = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(estado.token && { Authorization: `Bearer ${estado.token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  let data = {};
  try { data = await res.json(); } catch (e) { /* respuesta sin body */ }

  if (!res.ok) {
    if (res.status === 401 && estado.token) cerrarSesion(false);
    const detalle = data.detalles ? ` (${data.detalles.map((d) => d.mensaje).join('; ')})` : '';
    throw new Error((data.error || 'Error inesperado') + detalle);
  }
  return data;
}

const esAdmin = () => Boolean(estado.usuario && estado.usuario.rol === 'admin');

const formatoPrecio = (n) =>
  Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const formatoFecha = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const pad = (n) => String(n).padStart(2, '0');

function crearEl(tag, { texto, clase, attrs } = {}) {
  const el = document.createElement(tag);
  if (texto !== undefined) el.textContent = texto;
  if (clase) el.className = clase;
  if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

// Efecto "onda" al hacer clic en botones
document.addEventListener('pointerdown', (e) => {
  const btn = e.target.closest('.btn, .tab, .seg, .ampm-btn');
  if (!btn || btn.disabled) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const onda = document.createElement('span');
  onda.className = 'ripple';
  onda.style.width = `${size}px`;
  onda.style.height = `${size}px`;
  onda.style.left = `${e.clientX - rect.left - size / 2}px`;
  onda.style.top = `${e.clientY - rect.top - size / 2}px`;
  btn.appendChild(onda);
  onda.addEventListener('animationend', () => onda.remove());
});

// Modales: se cierran con la X, con "Cancelar", con Esc y haciendo clic en el fondo
function conectarModal(dlg) {
  let empezoEnFondo = false;
  dlg.addEventListener('pointerdown', (e) => { empezoEnFondo = e.target === dlg; });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg && empezoEnFondo) dlg.close();
    if (e.target.closest('[data-cerrar]')) dlg.close();
  });
}

// ---------- Sesión ----------
function guardarSesion(token, usuario) {
  estado.token = token;
  estado.usuario = usuario;
  almacen.guardar('token', token);
}

function cerrarSesion(avisar = true) {
  estado.token = null;
  estado.usuario = null;
  estado.servicios = [];
  almacen.borrar('token');
  // Vaciamos lo que quedó en pantalla para que la próxima persona no vea datos ni botones de la anterior
  $('#lista-servicios').replaceChildren();
  $('#select-servicio').replaceChildren();
  $('#tabla-turnos').replaceChildren();
  $('#form-turno').reset();
  $('#vista-app').classList.add('hidden');
  $('#sesion').classList.add('hidden');
  $('#vista-auth').classList.remove('hidden');
  if (avisar) mostrarMensaje('Sesión cerrada');
}

async function entrarALaApp() {
  $('#vista-auth').classList.add('hidden');
  $('#vista-app').classList.remove('hidden');
  $('#sesion').classList.remove('hidden');
  $('#saludo').textContent = `Hola, ${estado.usuario.nombre}${esAdmin() ? ' (admin)' : ''}`;
  $('#titulo-turnos').textContent = esAdmin() ? 'Todos los turnos' : 'Mis turnos';
  $('#btn-nuevo-servicio').classList.toggle('hidden', !esAdmin());
  document.querySelectorAll('.col-admin').forEach((el) => el.classList.toggle('hidden', !esAdmin()));

  $('#input-fecha').min = new Date().toLocaleDateString('en-CA');

  try {
    estado.config = await api('GET', '/config');
  } catch (e) { /* si falla, quedan los horarios por defecto; el servidor valida igual */ }

  await Promise.all([cargarServicios(), cargarTurnos()]);
}

// ---------- Servicios ----------
async function cargarServicios() {
  const { data } = await api('GET', '/servicios');
  estado.servicios = data;
  renderServicios();
}

function renderServicios() {
  const lista = $('#lista-servicios');
  const select = $('#select-servicio');
  const valorPrevio = select.value;
  lista.replaceChildren();
  select.replaceChildren();

  // La administradora ve todos (incluso los inactivos); las clientas solo los disponibles
  const visibles = esAdmin() ? estado.servicios : estado.servicios.filter((s) => s.activo);

  visibles.forEach((s) => {
    const li = crearEl('li', { clase: `servicio${s.activo ? '' : ' inactivo'}` });

    const titulo = crearEl('h3', { texto: s.nombre });
    if (!s.activo) titulo.append(crearEl('span', { texto: 'Inactivo', clase: 'etiqueta-inactivo' }));

    li.append(
      titulo,
      crearEl('p', { texto: s.descripcion || '' }),
      crearEl('span', { clase: 'meta', texto: `${formatoPrecio(s.precio)} · ${s.duracion_minutos} min` })
    );

    if (esAdmin()) {
      const acciones = crearEl('div', { clase: 'servicio-acciones' });
      acciones.append(
        crearEl('button', {
          texto: '✏️ Editar',
          clase: 'btn btn-soft btn-small',
          attrs: { type: 'button', 'data-editar': s.id },
        })
      );
      li.append(acciones);
    }
    lista.append(li);

    if (s.activo) {
      const opt = crearEl('option', { texto: `${s.nombre} (${s.duracion_minutos} min)`, attrs: { value: s.id } });
      opt.dataset.duracion = s.duracion_minutos;
      select.append(opt);
    }
  });

  if (valorPrevio && [...select.options].some((o) => o.value === valorPrevio)) select.value = valorPrevio;
}

$('#lista-servicios').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-editar]');
  if (!btn) return;
  const servicio = estado.servicios.find((s) => s.id === Number(btn.dataset.editar));
  if (servicio) abrirModalServicio(servicio);
});

// ---------- Modal de servicio (crear / editar) ----------
const modalServicio = $('#modal-servicio');
const formServicio = $('#form-servicio');
conectarModal(modalServicio);

function errorServicio(texto) {
  const el = $('#servicio-error');
  el.textContent = texto || '';
  el.classList.toggle('hidden', !texto);
}

function abrirModalServicio(servicio = null) {
  formServicio.reset();
  errorServicio('');
  const editando = Boolean(servicio);

  $('#modal-servicio-titulo').textContent = editando ? 'Editar servicio' : 'Nuevo servicio';
  $('#btn-eliminar-servicio').classList.toggle('hidden', !editando);

  formServicio.elements.id.value = editando ? servicio.id : '';
  formServicio.elements.nombre.value = editando ? servicio.nombre : '';
  formServicio.elements.descripcion.value = editando ? servicio.descripcion || '' : '';
  formServicio.elements.precio.value = editando ? Number(servicio.precio) : '';
  formServicio.elements.duracion_minutos.value = editando ? servicio.duracion_minutos : '';
  formServicio.elements.activo.checked = editando ? Boolean(servicio.activo) : true;

  modalServicio.showModal();
  formServicio.elements.nombre.focus();
}

$('#btn-nuevo-servicio').addEventListener('click', () => abrirModalServicio());

formServicio.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorServicio('');

  const f = formServicio.elements;
  const nombre = f.nombre.value.trim();
  const precio = Number(f.precio.value);
  const duracion = Number(f.duracion_minutos.value);

  if (!nombre) return errorServicio('El nombre es obligatorio');
  if (!(precio > 0)) return errorServicio('El precio debe ser mayor a 0');
  if (!Number.isInteger(duracion) || duracion < 5 || duracion > 480) {
    return errorServicio('La duración debe ser un número entero entre 5 y 480 minutos');
  }

  const body = {
    nombre,
    descripcion: f.descripcion.value.trim() || null,
    precio,
    duracion_minutos: duracion,
    activo: f.activo.checked,
  };

  const id = f.id.value;
  try {
    if (id) await api('PUT', `/servicios/${id}`, body);
    else await api('POST', '/servicios', body);

    modalServicio.close();
    mostrarMensaje(id ? 'Servicio actualizado' : 'Servicio creado');
    await cargarServicios();
  } catch (err) {
    return errorServicio(err.message);
  }
  return undefined;
});

$('#btn-eliminar-servicio').addEventListener('click', async () => {
  const id = formServicio.elements.id.value;
  if (!id || !confirm('¿Eliminar este servicio? Esta acción no se puede deshacer.')) return;
  try {
    await api('DELETE', `/servicios/${id}`);
    modalServicio.close();
    mostrarMensaje('Servicio eliminado');
    await cargarServicios();
  } catch (err) {
    errorServicio(`${err.message}. Si ya tiene turnos, podés desactivarlo en lugar de eliminarlo.`);
  }
});

// ---------- Turnos ----------
function botonAccion(texto, accion, id, clase = '') {
  return crearEl('button', {
    texto,
    clase: `btn btn-small ${clase}`.trim(),
    attrs: { type: 'button', 'data-accion': accion, 'data-id': id },
  });
}

async function cargarTurnos() {
  const { data } = await api('GET', '/turnos');
  const tbody = $('#tabla-turnos');
  tbody.replaceChildren();
  $('#sin-turnos').classList.toggle('hidden', data.length > 0);

  data.forEach((t) => {
    const tr = crearEl('tr');
    tr.append(
      crearEl('td', { texto: formatoFecha(t.fecha) }),
      crearEl('td', { texto: String(t.hora).slice(0, 5) }),
      crearEl('td', { texto: t.servicio ? t.servicio.nombre : '-' })
    );

    if (esAdmin()) tr.append(crearEl('td', { texto: t.cliente ? t.cliente.nombre : '-' }));

    const tdEstado = crearEl('td');
    tdEstado.append(crearEl('span', { texto: t.estado, clase: `estado ${t.estado}` }));
    tr.append(tdEstado);

    const tdAcc = crearEl('td');
    const acciones = crearEl('div', { clase: 'acciones' });
    const activo = ['pendiente', 'confirmado'].includes(t.estado);
    if (esAdmin()) {
      if (t.estado === 'pendiente') acciones.append(botonAccion('Confirmar', 'confirmado', t.id, 'btn-ok'));
      if (t.estado === 'confirmado') acciones.append(botonAccion('Completar', 'completado', t.id, 'btn-ok'));
    }
    if (activo) acciones.append(botonAccion('Cancelar', 'cancelado', t.id, 'btn-soft'));
    acciones.append(botonAccion('Eliminar', 'eliminar', t.id, 'btn-danger'));
    tdAcc.append(acciones);
    tr.append(tdAcc);

    tbody.append(tr);
  });
}

// ============================================================
// Selector de hora con reloj circular
// ============================================================
const modalHora = $('#modal-hora');
const dial = $('#dial');
const inputHora = $('#input-hora');
conectarModal(modalHora);

const reloj = { modo: 'hora', h12: 9, min: 0, ampm: 'AM', duracion: 0 };

// Aguja del reloj: se crea una sola vez y gira por el camino más corto
const aguja = crearEl('div', { clase: 'dial-hand' });
dial.append(aguja);
let anguloActual = 0;
function fijarAngulo(objetivo) {
  const actual = ((anguloActual % 360) + 360) % 360;
  anguloActual += ((objetivo - actual + 540) % 360) - 180;
  aguja.style.setProperty('--ang', `${anguloActual}deg`);
}

const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const a24 = (h12, ampm) => (h12 % 12) + (ampm === 'PM' ? 12 : 0);

// Un inicio es válido si el turno entero (con la duración del servicio) cabe en el horario de atención
function inicioPermitido(minutos) {
  return (
    minutos >= aMinutos(estado.config.hora_apertura) &&
    minutos + reloj.duracion <= aMinutos(estado.config.hora_cierre)
  );
}

function horaPermitida(h12, ampm) {
  for (let m = 0; m < 60; m += 5) if (inicioPermitido(a24(h12, ampm) * 60 + m)) return true;
  return false;
}

function minutoPermitido(min) {
  return inicioPermitido(a24(reloj.h12, reloj.ampm) * 60 + min);
}

function primerMinutoPermitido() {
  for (let m = 0; m < 60; m += 5) if (minutoPermitido(m)) return m;
  return 0;
}

function horaValida() {
  return inicioPermitido(a24(reloj.h12, reloj.ampm) * 60 + reloj.min);
}

function dibujarReloj() {
  // Pantalla digital
  $('#clk-h').textContent = pad(reloj.h12);
  $('#clk-m').textContent = pad(reloj.min);
  $('#clk-h').classList.toggle('activo', reloj.modo === 'hora');
  $('#clk-m').classList.toggle('activo', reloj.modo === 'minutos');
  ['AM', 'PM'].forEach((v) => {
    const b = $(`#clk-${v.toLowerCase()}`);
    b.classList.toggle('activo', reloj.ampm === v);
    b.setAttribute('aria-pressed', String(reloj.ampm === v));
  });

  // Esfera: los 12 números se vuelven a crear solo al cambiar entre horas y minutos;
  // el resto del tiempo se actualizan en el lugar (así no parpadean al arrastrar)
  const horas = reloj.modo === 'hora';

  if (dial.dataset.modo !== reloj.modo) {
    dial.querySelectorAll('.dial-num').forEach((n) => n.remove());
    const radio = 100;
    const centro = 124;
    for (let i = 0; i < 12; i += 1) {
      const valor = horas ? (i === 0 ? 12 : i) : i * 5;
      const rad = (i * 30 * Math.PI) / 180;
      const n = crearEl('button', {
        texto: horas ? String(valor) : pad(valor),
        clase: 'dial-num',
        attrs: { type: 'button', 'data-valor': valor, 'aria-label': horas ? `${valor} horas` : `${valor} minutos` },
      });
      n.style.left = `${centro + radio * Math.sin(rad)}px`;
      n.style.top = `${centro - radio * Math.cos(rad)}px`;
      n.style.animationDelay = `${i * 18}ms`;
      dial.append(n);
    }
    dial.dataset.modo = reloj.modo;
  }

  dial.querySelectorAll('.dial-num').forEach((n) => {
    const valor = Number(n.dataset.valor);
    n.disabled = !(horas ? horaPermitida(valor, reloj.ampm) : minutoPermitido(valor));
    n.classList.toggle('sel', horas ? valor === reloj.h12 : valor === reloj.min);
  });

  fijarAngulo(horas ? (reloj.h12 % 12) * 30 : reloj.min * 6);

  // Ayuda y botón Aceptar
  const hint = $('#clk-hint');
  const valida = horaValida();
  const detalle = `Horario de atención: ${estado.config.hora_apertura} a ${estado.config.hora_cierre} hs`;
  const duracion = reloj.duracion ? ` · El servicio dura ${reloj.duracion} min` : '';
  hint.classList.toggle('error', !valida);
  hint.textContent = valida ? `${detalle}${duracion}` : `Ese horario no entra en la jornada. ${detalle}${duracion}`;
  $('#clk-ok').disabled = !valida;
}

function elegirValor(valor) {
  if (reloj.modo === 'hora') {
    if (!horaPermitida(valor, reloj.ampm)) return false;
    reloj.h12 = valor;
    if (!minutoPermitido(reloj.min)) reloj.min = primerMinutoPermitido();
  } else {
    if (!minutoPermitido(valor)) return false;
    reloj.min = valor;
  }
  dibujarReloj();
  return true;
}

function valorDesdePuntero(e) {
  const r = dial.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  if (Math.hypot(dx, dy) < 28) return null; // muy cerca del centro
  let ang = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (ang < 0) ang += 360;
  const idx = Math.round(ang / 30) % 12;
  return reloj.modo === 'hora' ? (idx === 0 ? 12 : idx) : idx * 5;
}

// Elegir arrastrando o tocando la esfera
let arrastrando = false;
dial.addEventListener('pointerdown', (e) => {
  arrastrando = true;
  dial.setPointerCapture(e.pointerId);
  const v = valorDesdePuntero(e);
  if (v !== null) elegirValor(v);
});
dial.addEventListener('pointermove', (e) => {
  if (!arrastrando) return;
  const v = valorDesdePuntero(e);
  if (v !== null) elegirValor(v);
});
const soltarDial = () => {
  if (!arrastrando) return;
  arrastrando = false;
  // Al soltar la hora, pasa sola a los minutos
  if (reloj.modo === 'hora') {
    reloj.modo = 'minutos';
    dibujarReloj();
  }
};
dial.addEventListener('pointerup', soltarDial);
dial.addEventListener('pointercancel', () => { arrastrando = false; });

// Teclado: los números son botones, Enter/Espacio los elige
dial.addEventListener('keydown', (e) => {
  const b = e.target.closest('.dial-num');
  if (!b || (e.key !== 'Enter' && e.key !== ' ')) return;
  e.preventDefault();
  if (elegirValor(Number(b.dataset.valor)) && reloj.modo === 'hora') {
    reloj.modo = 'minutos';
    dibujarReloj();
  }
});

$('#clk-h').addEventListener('click', () => { reloj.modo = 'hora'; dibujarReloj(); });
$('#clk-m').addEventListener('click', () => { reloj.modo = 'minutos'; dibujarReloj(); });

function cambiarAmPm(valor) {
  reloj.ampm = valor;
  if (!horaPermitida(reloj.h12, valor)) {
    // Busca la primera hora válida en ese tramo del día
    for (let h = 1; h <= 12; h += 1) {
      if (horaPermitida(h, valor)) { reloj.h12 = h; break; }
    }
  }
  if (!minutoPermitido(reloj.min)) reloj.min = primerMinutoPermitido();
  dibujarReloj();
}
$('#clk-am').addEventListener('click', () => cambiarAmPm('AM'));
$('#clk-pm').addEventListener('click', () => cambiarAmPm('PM'));

$('#clk-ok').addEventListener('click', () => {
  if (!horaValida()) return;
  inputHora.value = `${pad(a24(reloj.h12, reloj.ampm))}:${pad(reloj.min)}`;
  modalHora.close();
});

function duracionSeleccionada() {
  const opt = $('#select-servicio').selectedOptions[0];
  return opt ? Number(opt.dataset.duracion) || 0 : 0;
}

function abrirReloj() {
  reloj.duracion = duracionSeleccionada();
  reloj.modo = 'hora';

  if (/^\d{2}:\d{2}$/.test(inputHora.value)) {
    // Retoma la hora ya elegida
    const [h, m] = inputHora.value.split(':').map(Number);
    reloj.ampm = h >= 12 ? 'PM' : 'AM';
    reloj.h12 = h % 12 === 0 ? 12 : h % 12;
    reloj.min = m - (m % 5);
  } else {
    // Arranca en el primer horario disponible del día
    const apertura = aMinutos(estado.config.hora_apertura);
    let inicio = apertura;
    while (inicio < 24 * 60 && !inicioPermitido(inicio)) inicio += 5;
    const h = Math.floor(inicio / 60) % 24;
    reloj.ampm = h >= 12 ? 'PM' : 'AM';
    reloj.h12 = h % 12 === 0 ? 12 : h % 12;
    reloj.min = inicio % 60;
  }

  dibujarReloj();
  modalHora.showModal();
}

inputHora.addEventListener('click', abrirReloj);
inputHora.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    abrirReloj();
  }
});

// Si cambia el servicio (otra duración), la hora elegida puede dejar de entrar en la jornada
$('#select-servicio').addEventListener('change', () => {
  if (!inputHora.value) return;
  reloj.duracion = duracionSeleccionada();
  if (!inicioPermitido(aMinutos(inputHora.value))) {
    inputHora.value = '';
    mostrarMensaje('Cambió la duración del servicio: volvé a elegir la hora', 'error');
  }
});

// ---------- Eventos generales ----------
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('activo', t === tab));
    $('#form-login').classList.toggle('hidden', tab.dataset.tab !== 'login');
    $('#form-registro').classList.toggle('hidden', tab.dataset.tab !== 'registro');
  });
});

$('#form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(e.target));
  try {
    const res = await api('POST', '/auth/login', datos);
    guardarSesion(res.token, res.data);
    e.target.reset();
    await entrarALaApp();
  } catch (err) {
    mostrarMensaje(err.message, 'error');
  }
});

$('#form-registro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(e.target));
  if (!datos.telefono) delete datos.telefono;
  try {
    const res = await api('POST', '/auth/register', datos);
    guardarSesion(res.token, res.data);
    e.target.reset();
    mostrarMensaje('Cuenta creada, ¡bienvenida!');
    await entrarALaApp();
  } catch (err) {
    mostrarMensaje(err.message, 'error');
  }
});

$('#btn-logout').addEventListener('click', () => cerrarSesion());

$('#form-turno').addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(e.target));
  if (!datos.hora) {
    mostrarMensaje('Elegí la hora del turno tocando el campo "Hora"', 'error');
    return;
  }
  datos.servicio_id = Number(datos.servicio_id);
  if (!datos.notas) delete datos.notas;
  try {
    await api('POST', '/turnos', datos);
    e.target.reset();
    mostrarMensaje('Turno reservado');
    await cargarTurnos();
  } catch (err) {
    mostrarMensaje(err.message, 'error');
  }
});

$('#tabla-turnos').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-accion]');
  if (!btn) return;
  const { accion, id } = btn.dataset;

  try {
    if (accion === 'eliminar') {
      if (!confirm('¿Eliminar este turno?')) return;
      await api('DELETE', `/turnos/${id}`);
      mostrarMensaje('Turno eliminado');
    } else {
      await api('PUT', `/turnos/${id}`, { estado: accion });
      mostrarMensaje(`Turno ${accion}`);
    }
    await cargarTurnos();
  } catch (err) {
    mostrarMensaje(err.message, 'error');
  }
});

// ---------- Inicio: si hay token guardado, intentar retomar la sesión ----------
(async () => {
  if (!estado.token) return;
  try {
    const res = await api('GET', '/auth/me');
    estado.usuario = res.data;
    await entrarALaApp();
  } catch (err) {
    cerrarSesion(false);
  }
})();
