const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

const corsOrigin =
  env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
