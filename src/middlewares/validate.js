const AppError = require('../utils/AppError');

/**
 * Validate `req.body` with a zod schema.
 * On success, `req.body` is replaced with the cleaned data (trimmed, lowercased, and so on).
 */
const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return next(AppError.validation(details));
  }

  req.body = result.data;
  return next();
};

module.exports = validate;
