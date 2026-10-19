# 💅 Manicuría API – Sistema de turnos

API RESTful para gestionar los turnos de una manicuría: las clientas se registran, ven el catálogo de servicios y reservan turnos; la administradora gestiona los servicios (precios incluidos), las clientas y el estado de los turnos.

Trabajo Práctico Integrador – Back End (Ada ITW).

**Integrantes:** Lourdes Torres Ramonell – luli2000cuenta2.0@gmail.com
| | |
|---|---|
| **API desplegada (Render)** |https://manicuria-api.onrender.com/publicada |
| **Repositorio** | https://github.com/LourdesTorresRamonell/manicuria-api_ |
| **Documentación de la API** | [Endpoints](#endpoints) · [Colección de Postman](postman/manicuria-api.postman_collection.json) |

---

## Capturas de pantalla

| Ingreso | Panel de la administradora |
|---|---|
| ![Ingreso](docs/screenshots/login.png) | ![Panel de la administradora](docs/screenshots/panel-admin.png) |

| Editar un servicio (modal) | Selector de hora con reloj circular |
|---|---|
| ![Modal de servicio](docs/screenshots/modal-servicio.png) | ![Reloj circular](docs/screenshots/reloj.png) |

---

## Tecnologías

- Node.js + Express 4
- MySQL + Sequelize (con `mysql2`)
- bcrypt (hash de contraseñas)
- JSON Web Tokens (autenticación)
- express-validator (validación de datos)
- express-rate-limit (protección contra fuerza bruta)
- helmet y cors (seguridad HTTP)
- Frontend básico en HTML, CSS y JavaScript (carpeta `public/`)

## Entidades y relaciones

| Entidad | Descripción |
|---|---|
| **Usuario** (`usuarios`) | Clientas y administradoras. Rol `cliente` o `admin`. |
| **Servicio** (`servicios`) | Lo que ofrece la manicuría: nombre, precio, duración en minutos. |
| **Turno** (`turnos`) | Reserva de un servicio por parte de un usuario en una fecha y hora. |

```
usuarios 1 ────< N turnos N >──── 1 servicios
```

- Un usuario puede tener muchos turnos (si se borra el usuario, se borran sus turnos).
- Un servicio puede estar en muchos turnos (no se puede borrar un servicio que tiene turnos: devuelve `409`; en ese caso se puede desactivar).

## Funcionalidades

- Registro e inicio de sesión con JWT.
- Catálogo de servicios público.
- **La administradora** puede agregar servicios, editar nombre, descripción, precio y duración, activarlos o desactivarlos y eliminarlos (desde un modal en el frontend o con la API).
- Reserva de turnos con reglas de negocio:
  - Solo dentro del horario de atención (por defecto 09:00 a 20:00).
  - El turno completo (con la duración del servicio) tiene que entrar en la jornada.
  - No se permiten fechas pasadas.
  - No se permiten turnos que se superpongan.
- Cada clienta ve y gestiona únicamente sus turnos; la administradora ve todos y puede confirmarlos o completarlos.
- Una clienta solo puede **cancelar** su turno; confirmar y completar es exclusivo de la administradora.
- **Frontend:** selector de hora con reloj circular que solo habilita los horarios disponibles, botones animados y paleta celeste y blanca.

---

## Instalación y ejecución

### Requisitos

- Node.js 18 o superior
- MySQL 8 (y MySQL Workbench)

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repo>
cd manicuria-api
npm install
```

### 2. Crear la base de datos

Tenés dos opciones:

**Opción A – Con MySQL Workbench (recomendada para la consigna):**
abrí `sql/schema.sql` en Workbench, conectate a tu servidor (Database → Connect to Database) y ejecutalo con el rayito ⚡. Crea la base `manicuria_db` y las tres tablas con sus relaciones. En el `.env` poné `DB_SYNC=false`.

**Opción B – Que Sequelize cree las tablas:**
creá solo la base vacía (`CREATE DATABASE manicuria_db;`) y dejá `DB_SYNC=true` en el `.env`. Las tablas se crean al arrancar.

### 3. Configurar las variables de entorno

```bash
cp .env.example .env      # en Windows (PowerShell): copy .env.example .env
```

Editá `.env` y completá como mínimo `DB_PASSWORD` y `JWT_SECRET`:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (3000 por defecto). |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión a MySQL. `DB_PASSWORD` es la contraseña de tu usuario de MySQL (la que elegiste al instalarlo). |
| `DATABASE_URL` | Alternativa: una sola URL `mysql://usuario:password@host:3306/db`. Si está definida, tiene prioridad. |
| `DB_SSL` | `true` si tu MySQL en la nube exige SSL. |
| `DB_SYNC` | `true` para que Sequelize cree las tablas al arrancar. |
| `JWT_SECRET` | Secreto para firmar los tokens. Lo inventás vos: usá uno largo y aleatorio. |
| `JWT_EXPIRES_IN` | Duración del token (por ejemplo `2h`). |
| `BCRYPT_ROUNDS` | Costo del hash de bcrypt (10 por defecto). |
| `ADMIN_NOMBRE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Administradora inicial: se crea sola al arrancar si no existe. |
| `SEED_DEMO_DATA` | `true` para cargar servicios de ejemplo si la tabla está vacía. |
| `HORA_APERTURA`, `HORA_CIERRE` | Horario de atención (`HH:MM`). |

Para generar un `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```


### 4. Ejecutar

```bash
npm start        # producción
npm run dev      # desarrollo (reinicia al guardar cambios)
```

La API queda en `http://localhost:3000/api` y el frontend en `http://localhost:3000`.

Comandos extra:

```bash
npm run seed         # crea tablas, administradora y servicios de ejemplo (sin levantar el servidor)
npm run test:smoke   # prueba de punta a punta contra una API ya levantada
```

---

## Autenticación

Las rutas protegidas requieren el header:

```
Authorization: Bearer <token>
```

El token se obtiene en `POST /api/auth/login` o `POST /api/auth/register`.

## Endpoints

Base URL: `/api`

### General

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Verifica que la API está viva. |
| GET | `/config` | Público | Devuelve el horario de atención (`hora_apertura`, `hora_cierre`). |

### Auth

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/register` | Público | Registra una clienta y devuelve un token. |
| POST | `/auth/login` | Público | Inicia sesión y devuelve un token. |
| GET | `/auth/me` | Autenticada | Devuelve el perfil del usuario del token. |

### Servicios

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/servicios` | Público | Lista servicios. Filtro opcional `?activo=true`. |
| GET | `/servicios/:id` | Público | Obtiene un servicio. |
| POST | `/servicios` | Admin | Crea un servicio. |
| PUT | `/servicios/:id` | Admin | Actualiza un servicio (nombre, descripción, precio, duración, activo). |
| DELETE | `/servicios/:id` | Admin | Elimina un servicio (409 si tiene turnos). |

### Turnos

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/turnos` | Autenticada | Clienta: sus turnos. Admin: todos. Filtros `?estado=`, `?fecha=YYYY-MM-DD`, `?usuario_id=` (solo admin). |
| GET | `/turnos/:id` | Dueña o admin | Obtiene un turno. |
| POST | `/turnos` | Autenticada | Reserva un turno (la admin puede indicar `usuario_id`). |
| PUT | `/turnos/:id` | Dueña o admin | Modifica fecha, hora, servicio, notas o estado. |
| DELETE | `/turnos/:id` | Dueña o admin | Elimina un turno. |

### Usuarios

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/usuarios` | Admin | Lista usuarios. |
| GET | `/usuarios/:id` | Propio o admin | Obtiene un usuario. |
| POST | `/usuarios` | Admin | Crea un usuario con cualquier rol. |
| PUT | `/usuarios/:id` | Propio o admin | Actualiza un usuario (solo admin puede cambiar el rol). |
| DELETE | `/usuarios/:id` | Admin | Elimina un usuario. |

## Ejemplos de uso

**Registro**

```http
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Sofía Pérez",
  "email": "sofia@mail.com",
  "password": "Clave1234",
  "telefono": "1155551234"
}
```

```json
{
  "message": "Usuario registrado correctamente",
  "data": { "id": 2, "nombre": "Sofía Pérez", "email": "sofia@mail.com", "telefono": "1155551234", "rol": "cliente" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

**Crear un servicio (admin)**

```http
POST /api/servicios
Authorization: Bearer <token-de-admin>
Content-Type: application/json

{
  "nombre": "Kapping gel",
  "descripcion": "Refuerzo de uña natural con gel",
  "precio": 15000,
  "duracion_minutos": 75
}
```

**Cambiar el precio de un servicio (admin)**

```http
PUT /api/servicios/2
Authorization: Bearer <token-de-admin>
Content-Type: application/json

{ "precio": 13500 }
```

**Reservar un turno**

```http
POST /api/turnos
Authorization: Bearer <token>
Content-Type: application/json

{
  "servicio_id": 2,
  "fecha": "2026-12-15",
  "hora": "10:00",
  "notas": "Diseño floral"
}
```

```json
{
  "message": "Turno reservado",
  "data": {
    "id": 1,
    "fecha": "2026-12-15",
    "hora": "10:00:00",
    "estado": "pendiente",
    "servicio": { "id": 2, "nombre": "Esmaltado semipermanente", "precio": "12000.00", "duracion_minutos": 60 },
    "cliente": { "id": 2, "nombre": "Sofía Pérez", "email": "sofia@mail.com" }
  }
}
```

**Formato de errores**

```json
{ "error": "Datos inválidos", "detalles": [ { "campo": "email", "mensaje": "El formato del email no es válido" } ] }
```

| Código | Cuándo |
|---|---|
| 400 | Datos inválidos, fuera de horario, fecha pasada. |
| 401 | Falta el token, es inválido o expiró; credenciales incorrectas. |
| 403 | No tenés permisos para esa acción. |
| 404 | El registro o la ruta no existen. |
| 409 | Email duplicado, horario ocupado, servicio con turnos asociados. |
| 429 | Demasiadas solicitudes (rate limiting). |
| 500 | Error interno. |

---

## Seguridad implementada

- **Contraseñas:** se guardan hasheadas con bcrypt; el hash nunca se devuelve en las respuestas.
- **Validación:** todos los endpoints validan los datos de entrada (campos obligatorios, formato de email, tipos, rangos, formato de fecha y hora) con express-validator.
- **Rate limiting:** 200 solicitudes cada 15 minutos por IP en toda la API, y solo 10 cada 15 minutos en `/auth/login` y `/auth/register` para frenar ataques de fuerza bruta.
- **Autorización por rol:** las clientas solo acceden a sus propios datos; nadie puede asignarse el rol `admin` desde el registro; solo la administradora crea, edita o borra servicios.
- **Login:** el mensaje de error es el mismo si falla el email o la contraseña.
- **Cabeceras seguras** con helmet, y límite de tamaño del body (10 KB).

## Cómo probar la API con Postman

1. En Postman: **Import** → seleccioná `postman/manicuria-api.postman_collection.json`.
2. Revisá la variable de colección `baseUrl` (por defecto `http://localhost:3000/api`; cambiala por la URL de Render para probar el deploy).
3. Ejecutá las carpetas en orden (1 → 5), o usá el **Collection Runner**. Los tokens y los ids se guardan solos en variables de colección.
4. La colección tiene 37 requests con tests automáticos, e incluye casos extremos: datos inválidos, sin token, sin permisos, horario ocupado, fuera de horario, ids inexistentes.

También se puede correr desde la terminal con Newman (con la API levantada):

```bash
npx newman run postman/manicuria-api.postman_collection.json --env-var "baseUrl=http://localhost:3000/api"
```

Notas:
- Las requests de turnos usan la fecha `2026-12-15`; si ya pasó, cambiala por una futura.
- Como `/auth` tiene un límite de 10 intentos cada 15 minutos, si corrés la colección completa muchas veces seguidas vas a recibir `429`. Es el rate limiting funcionando.
- La administradora inicial es la que definiste en `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`.

## Frontend

Al abrir `http://localhost:3000` se puede crear una cuenta, iniciar sesión, ver los servicios, reservar turnos y cancelarlos o eliminarlos.

- **Clienta:** ve los servicios disponibles y sus propios turnos.
- **Administradora:** además ve los servicios inactivos, puede crear y editar servicios y precios desde un modal, y ve todos los turnos para confirmarlos o completarlos.
- **Hora:** se elige en un reloj circular (primero la hora, después los minutos). Solo habilita los horarios en los que el servicio entra dentro del horario de atención.

### Cómo cambiar el logo

El logo que aparece es de ejemplo. Se usa en tres lugares: el encabezado, la pantalla de ingreso y el ícono de la pestaña del navegador. Para poner el tuyo:

1. Reemplazá el archivo `public/logo.png` por el tuyo con el mismo nombre; o
2. si es un PNG o JPG, copialo en `public/` y cambiá `logo.png` por tu archivo en las dos etiquetas `<img>` y en el `<link rel="icon">` de `public/index.html`.

Una imagen cuadrada (de unos 256 × 256 px) es lo que mejor se ve.

---

## Deploy en Render

La API necesita una base MySQL accesible desde internet (Render no ofrece MySQL propio), así que primero hay que tener una en la nube.

1. **Base de datos en la nube:** creá una instancia MySQL en un proveedor (por ejemplo Aiven, Railway o TiDB Cloud; fijate qué plan gratuito o de prueba ofrece cada uno) y copiá los datos de conexión. Ejecutá `sql/schema.sql` si querés crear las tablas a mano, o dejá `DB_SYNC=true`.
2. **Subir el código a GitHub** (sin el `.env`).
3. En [render.com](https://render.com): **New → Web Service** y conectá el repositorio.
4. Configuración:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. **Environment Variables** (las mismas del `.env`):
   - `DATABASE_URL` (o `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`)
   - `DB_SSL=true` si el proveedor lo exige
   - `DB_SYNC=true`
   - `JWT_SECRET` (uno largo y aleatorio, distinto al de tu máquina)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SEED_DEMO_DATA=true`
   - `NODE_ENV=production`
6. Desplegá, probá `https://<tu-servicio>.onrender.com/api/health` y pegá esa URL en este README y en la entrega.

> En el plan gratuito de Render el servicio se duerme tras un rato sin uso, así que la primera request puede tardar unos segundos en responder.

## Estructura del proyecto

```
manicuria-api/
├── docs/screenshots/        # Capturas del README
├── public/                  # Frontend (HTML, CSS, JS) y logo
├── postman/                 # Colección de Postman exportada
├── scripts/smoke-test.js    # Prueba de punta a punta
├── sql/schema.sql           # Script para MySQL Workbench
├── src/
│   ├── config/database.js   # Conexión de Sequelize
│   ├── models/              # Usuario, Servicio, Turno y relaciones
│   ├── controllers/         # Lógica de cada entidad
│   ├── routes/              # Rutas y validaciones
│   ├── middlewares/         # Auth, validación, rate limit, errores
│   ├── bootstrap.js         # Admin inicial y datos de ejemplo
│   ├── seed.js              # npm run seed
│   ├── app.js               # Configuración de Express
│   └── server.js            # Arranque del servidor
├── .env.example
└── package.json
```
