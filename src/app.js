const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const routes = require('./routes');
const { limiterGeneral } = require('./middlewares/rateLimiter');
const { noEncontrado, manejarErrores } = require('./middlewares/errorHandler');

const app = express();

// Render (y otros hosts) usan un proxy: necesario para que el rate limit vea la IP real
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Frontend básico (carpeta public/)
app.use(express.static(path.join(__dirname, '..', 'public')));

// API
app.use('/api', limiterGeneral, routes);

app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;
