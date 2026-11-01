const bcrypt = require('bcrypt');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/user.repository');
const { signAccessToken } = require('../utils/jwt');

const UNIQUE_VIOLATION = '23505';

// Used when the email is unknown, so the response time is similar to a wrong password.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', env.BCRYPT_ROUNDS);

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

/**
 * Check email and password and return an access token.
 * Unknown email and wrong password give the same error, so an attacker cannot
 * find out which emails are registered.
 */
const login = async ({ email, password }) => {
  const user = await userRepository.findByEmailWithPassword(email);
  const passwordMatches = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

  if (!user || !passwordMatches) {
    throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const { token, expiresIn } = signAccessToken(user.id);
  return { access_token: token, token_type: 'Bearer', expires_in: expiresIn };
};

module.exports = { register, login };
