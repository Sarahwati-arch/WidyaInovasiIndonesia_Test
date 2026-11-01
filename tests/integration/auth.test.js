const request = require('supertest');
const app = require('../../src/app');
const { migrateUp, cleanDb, closeDb } = require('../helpers/db');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await migrateUp();
  });

  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe('POST /api/v1/auth/register', () => {
    const validPayload = {
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      gender: 'female',
      password: 'Password123',
    };

    it('returns 201 and created user profile without password or password_hash', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        gender: 'female',
      });
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.created_at).toBeDefined();
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.password_hash).toBeUndefined();
    });

    it('normalizes email by trimming whitespace and lowercasing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validPayload,
          email: '  SARAH.UPPER@EXAMPLE.COM  ',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('sarah.upper@example.com');
    });

    it('returns 400 VALIDATION_ERROR when required fields are missing', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });

    it('returns 400 VALIDATION_ERROR when email format is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validPayload,
          email: 'invalid-email',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 VALIDATION_ERROR when gender is not male or female', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validPayload,
          gender: 'other',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 VALIDATION_ERROR when password is too short', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validPayload,
          password: 'Pass1',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 VALIDATION_ERROR when password lacks a number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validPayload,
          password: 'PasswordOnly',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 409 EMAIL_ALREADY_USED when email is already registered', async () => {
      await request(app).post('/api/v1/auth/register').send(validPayload);

      const res = await request(app).post('/api/v1/auth/register').send(validPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual({
        code: 'EMAIL_ALREADY_USED',
        message: 'Email is already registered',
      });
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const userCredentials = {
      name: 'Sarah Connor',
      email: 'sarah.login@example.com',
      gender: 'female',
      password: 'Password123',
    };

    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(userCredentials);
    });

    it('returns 200 with access_token, token_type Bearer, and expires_in', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: userCredentials.email,
        password: userCredentials.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('access_token');
      expect(typeof res.body.data.access_token).toBe('string');
      expect(res.body.data.token_type).toBe('Bearer');
      expect(typeof res.body.data.expires_in).toBe('number');
      expect(res.body.data.expires_in).toBeGreaterThan(0);
    });

    it('returns 400 VALIDATION_ERROR when email or password is missing', async () => {
      const resNoPassword = await request(app).post('/api/v1/auth/login').send({
        email: userCredentials.email,
      });

      expect(resNoPassword.status).toBe(400);
      expect(resNoPassword.body.success).toBe(false);
      expect(resNoPassword.body.error.code).toBe('VALIDATION_ERROR');

      const resNoEmail = await request(app).post('/api/v1/auth/login').send({
        password: userCredentials.password,
      });

      expect(resNoEmail.status).toBe(400);
      expect(resNoEmail.body.success).toBe(false);
      expect(resNoEmail.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 401 INVALID_CREDENTIALS when password does not match', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: userCredentials.email,
        password: 'WrongPassword999',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    });

    it('returns 401 INVALID_CREDENTIALS when email is not found', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: userCredentials.password,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    });
  });
});
