/* eslint-disable no-console */
const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

const server = app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
});

// Graceful shutdown: stop accepting requests, then close the DB pool.
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await db.pool.end();
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
