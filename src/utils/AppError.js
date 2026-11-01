/**
 * Error with an HTTP status and a machine readable code.
 * Services throw it, and the error middleware turns it into a JSON response.
 */
class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Bad request', details) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static validation(details) {
    return new AppError(400, 'VALIDATION_ERROR', 'Invalid request data', details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new AppError(401, code, message);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new AppError(404, code, message);
  }

  static conflict(message, code = 'CONFLICT') {
    return new AppError(409, code, message);
  }
}

module.exports = AppError;
