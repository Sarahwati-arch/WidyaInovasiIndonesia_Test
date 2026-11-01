const { execSync } = require('child_process');
const { pool } = require('../../src/config/db');

let migrated = false;

/**
 * Ensure migrations are executed on the test database.
 */
const migrateUp = async () => {
  if (!migrated) {
    execSync('npx node-pg-migrate up -m migrations', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
      stdio: 'ignore',
    });
    migrated = true;
  }
};

/**
 * Truncate the users table before each test to maintain test isolation.
 */
const cleanDb = async () => {
  await pool.query('TRUNCATE TABLE users CASCADE');
};

/**
 * Close database pool after tests complete.
 */
const closeDb = async () => {
  await pool.end();
};

module.exports = {
  migrateUp,
  cleanDb,
  closeDb,
  pool,
};
