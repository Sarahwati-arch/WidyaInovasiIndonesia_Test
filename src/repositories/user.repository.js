const db = require('../config/db');

// Columns that are safe to expose. `password_hash` is never part of this list.
const PUBLIC_COLUMNS = 'id, name, email, gender, created_at';

/** Insert a new user and return its public fields. */
const create = async ({ name, email, gender, passwordHash }) => {
  const { rows } = await db.query(
    `INSERT INTO users (name, email, gender, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, gender, passwordHash],
  );
  return rows[0];
};

/** Find a user by email, including `password_hash`. Only the login flow should use this. */
const findByEmailWithPassword = async (email) => {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = $1`,
    [email],
  );
  return rows[0] || null;
};

/** Find a user by id and return its public fields. */
const findById = async (id) => {
  const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
};

module.exports = { create, findByEmailWithPassword, findById };
