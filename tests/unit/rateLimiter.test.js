const { authRateLimiter, authRateLimitHandler } = require('../../src/middlewares/rateLimiter');
const AppError = require('../../src/utils/AppError');

describe('authRateLimiter middleware', () => {
  it('should skip rate limiting when NODE_ENV is test', (done) => {
    const req = { ip: '127.0.0.1' };
    const res = {
      setHeader: jest.fn(),
    };
    const next = jest.fn(() => {
      expect(next).toHaveBeenCalledTimes(1);
      done();
    });

    authRateLimiter(req, res, next);
  });

  it('should call next with AppError(429) when rate limit handler is invoked', () => {
    const req = {};
    const res = {};
    const next = jest.fn();

    authRateLimitHandler(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('TOO_MANY_REQUESTS');
  });
});
