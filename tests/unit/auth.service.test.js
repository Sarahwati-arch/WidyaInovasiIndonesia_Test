const bcrypt = require('bcrypt');
const authService = require('../../src/services/auth.service');
const userRepository = require('../../src/repositories/user.repository');

jest.mock('../../src/repositories/user.repository');

describe('auth.service', () => {
  describe('register', () => {
    const input = {
      name: 'Sarah',
      email: 'sarah@example.com',
      gender: 'female',
      password: 'Secret123',
    };

    it('hashes password and returns created user without password', async () => {
      const createdUser = {
        id: 'user-uuid-1',
        name: input.name,
        email: input.email,
        gender: input.gender,
        created_at: new Date().toISOString(),
      };

      userRepository.create.mockResolvedValue(createdUser);

      const result = await authService.register(input);

      expect(userRepository.create).toHaveBeenCalledTimes(1);
      const callArg = userRepository.create.mock.calls[0][0];
      expect(callArg.name).toBe(input.name);
      expect(callArg.email).toBe(input.email);
      expect(callArg.gender).toBe(input.gender);
      expect(callArg.passwordHash).toBeDefined();
      expect(callArg.passwordHash).not.toBe(input.password);
      expect(await bcrypt.compare(input.password, callArg.passwordHash)).toBe(true);

      expect(result).toEqual(createdUser);
    });

    it('throws AppError 409 EMAIL_ALREADY_USED on unique violation (code 23505)', async () => {
      const dbError = new Error('duplicate key value violates unique constraint');
      dbError.code = '23505';
      userRepository.create.mockRejectedValue(dbError);

      await expect(authService.register(input)).rejects.toMatchObject({
        name: 'AppError',
        statusCode: 409,
        code: 'EMAIL_ALREADY_USED',
        message: 'Email is already registered',
      });
    });

    it('rethrows unexpected database errors', async () => {
      const dbError = new Error('Connection failed');
      userRepository.create.mockRejectedValue(dbError);

      await expect(authService.register(input)).rejects.toThrow('Connection failed');
    });
  });

  describe('login', () => {
    const input = {
      email: 'sarah@example.com',
      password: 'Secret123',
    };

    it('returns access token, token type, and expires_in on matching credentials', async () => {
      const passwordHash = await bcrypt.hash(input.password, 4);
      const mockUser = {
        id: 'user-uuid-1',
        name: 'Sarah',
        email: input.email,
        gender: 'female',
        password_hash: passwordHash,
      };

      userRepository.findByEmailWithPassword.mockResolvedValue(mockUser);

      const result = await authService.login(input);

      expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith(input.email);
      expect(result).toHaveProperty('access_token');
      expect(typeof result.access_token).toBe('string');
      expect(result.token_type).toBe('Bearer');
      expect(typeof result.expires_in).toBe('number');
    });

    it('throws AppError 401 INVALID_CREDENTIALS when password does not match', async () => {
      const wrongPasswordHash = await bcrypt.hash('AnotherPassword', 4);
      const mockUser = {
        id: 'user-uuid-1',
        name: 'Sarah',
        email: input.email,
        gender: 'female',
        password_hash: wrongPasswordHash,
      };

      userRepository.findByEmailWithPassword.mockResolvedValue(mockUser);

      await expect(authService.login(input)).rejects.toMatchObject({
        name: 'AppError',
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    });

    it('throws AppError 401 INVALID_CREDENTIALS when email is not found', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(authService.login(input)).rejects.toMatchObject({
        name: 'AppError',
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    });
  });
});
