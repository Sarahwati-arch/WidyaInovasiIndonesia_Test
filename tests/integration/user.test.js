const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const env = require('../../src/config/env');
const { migrateUp, cleanDb, closeDb } = require('../helpers/db');

describe('User Endpoints', () => {
  beforeAll(async () => {
    await migrateUp();
  });

  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe('GET /api/v1/users/me', () => {
    const userPayload = {
      name: 'Sarah Connor',
      email: 'sarah.profile@example.com',
      gender: 'female',
      password: 'Password123',
    };

    let authToken;
    let registeredUser;

    beforeEach(async () => {
      const registerRes = await request(app).post('/api/v1/auth/register').send(userPayload);
      registeredUser = registerRes.body.data;

      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: userPayload.email,
        password: userPayload.password,
      });
      authToken = loginRes.body.data.access_token;
    });

    it('returns 200 and public profile for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        id: registeredUser.id,
        name: registeredUser.name,
        email: registeredUser.email,
        gender: registeredUser.gender,
        created_at: registeredUser.created_at,
      });
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.password_hash).toBeUndefined();
    });

    it('returns 401 TOKEN_MISSING when Authorization header is absent', async () => {
      const res = await request(app).get('/api/v1/users/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual({
        code: 'TOKEN_MISSING',
        message: 'Authorization header must be "Bearer <token>"',
      });
    });

    it('returns 401 TOKEN_MISSING when Authorization header does not use Bearer scheme', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Basic ${authToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TOKEN_MISSING');
    });

    it('returns 401 TOKEN_INVALID when token is malformed', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid.token.value');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual({
        code: 'TOKEN_INVALID',
        message: 'Token is not valid',
      });
    });

    it('returns 401 TOKEN_INVALID when token has an invalid signature', async () => {
      const wrongSecret = 'another_very_secret_key_that_is_at_least_32_characters_long';
      const tamperedToken = jwt.sign({}, wrongSecret, {
        subject: registeredUser.id,
        expiresIn: '1h',
        algorithm: 'HS256',
      });

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual({
        code: 'TOKEN_INVALID',
        message: 'Token is not valid',
      });
    });

    it('returns 401 TOKEN_EXPIRED when token has expired', async () => {
      const expiredToken = jwt.sign({}, env.JWT_SECRET, {
        subject: registeredUser.id,
        expiresIn: '-1s',
        algorithm: 'HS256',
      });

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual({
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
      });
    });

    it('returns 401 TOKEN_INVALID when token belongs to a non-existent user', async () => {
      const orphanToken = jwt.sign({}, env.JWT_SECRET, {
        subject: '00000000-0000-0000-0000-000000000000',
        expiresIn: '1h',
        algorithm: 'HS256',
      });

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${orphanToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual({
        code: 'TOKEN_INVALID',
        message: 'Token does not belong to an existing user',
      });
    });
  });
});
