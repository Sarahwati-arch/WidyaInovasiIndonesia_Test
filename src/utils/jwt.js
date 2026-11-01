const jwt = require('jsonwebtoken');
const env = require('../config/env');

const ALGORITHM = 'HS256';

/**
 * Sign an access token. The payload only holds the user id (`sub`).
 * Returns the token and its lifetime in seconds.
 */
const signAccessToken = (userId) => {
  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: ALGORITHM,
  });
  const { iat, exp } = jwt.decode(token);
  return { token, expiresIn: exp - iat };
};

/** Verify a token and return its payload. Throws a jsonwebtoken error if it is not valid. */
const verifyAccessToken = (token) => jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });

module.exports = { signAccessToken, verifyAccessToken };
