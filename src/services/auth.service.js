const bcrypt = require('bcrypt');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/user.repository');

const UNIQUE_VIOLATION = '23505';

/**
 * Create a new account.
 * The password is hashed before it is saved. Duplicate emails are detected by the
 * database unique constraint, which is safe even if two requests arrive at the same time.
 */
const register = async ({ name, email, gender, password }) => {
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  try {
    return await userRepository.create({ name, email, gender, passwordHash });
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      throw AppError.conflict('Email is already registered', 'EMAIL_ALREADY_USED');
    }
    throw err;
  }
};

module.exports = { register };
