const { execSync } = require('child_process');
const { pool } = require('../../src/config/db');

let migrated = false;

const assertTestDatabase = () => {
  const dbName = new URL(process.env.DATABASE_URL).pathname.slice(1);
  if (!dbName.endsWith('_test')) {
    throw new Error(
      `Refusing to run tests on database "${dbName}". Its name must end with "_test".`,
    );
  }
};

/**
 * Ensure migrations are executed on the test database.
 */
const migrateUp = async () => {
  assertTestDatabase();
  if (!migrated) {
    execSync('npx node-pg-migrate up -m migrations', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
      stdio: 'inherit',
    });
    migrated = true;
  }
};

/**
 * Truncate the users table before each test to maintain test isolation.
 */
const cleanDb = async () => {
  assertTestDatabase();
  await pool.query('TRUNCATE TABLE users CASCADE');
};

/**
 * Close database pool after tests complete.
 */
const closeDb = async () => {
  await pool.end();
};

module.exports = {
  assertTestDatabase,
  migrateUp,
  cleanDb,
  closeDb,
  pool,
};
