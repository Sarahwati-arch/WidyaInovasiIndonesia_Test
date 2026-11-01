const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/jwt');

/**
 * Protect a route. Expects `Authorization: Bearer <token>`.
 * On success, `req.user.id` holds the user id from the token.
 */
const authenticate = (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return next(
      AppError.unauthorized('Authorization header must be "Bearer <token>"', 'TOKEN_MISSING'),
    );
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    return next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';
    const message = code === 'TOKEN_EXPIRED' ? 'Token has expired' : 'Token is not valid';
    return next(AppError.unauthorized(message, code));
  }
};

module.exports = authenticate;
