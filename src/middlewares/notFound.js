const AppError = require('../utils/AppError');

const notFound = (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`, 'ROUTE_NOT_FOUND'));
};

module.exports = notFound;
