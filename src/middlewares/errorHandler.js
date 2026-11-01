/* eslint-disable no-console */
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { failure } = require('../utils/response');

// Express recognizes an error handler by its 4 arguments, so `_next` must stay.
const errorHandler = (err, _req, res, _next) => {
  // Malformed JSON body from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(failure('INVALID_JSON', 'Request body is not valid JSON'));
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(failure(err.code, err.message, err.details));
  }

  // Unexpected error: log it, but do not leak internals to the client.
  if (env.NODE_ENV !== 'test') {
    console.error(err);
  }
  return res.status(500).json(failure('INTERNAL_ERROR', 'Something went wrong'));
};

module.exports = errorHandler;
