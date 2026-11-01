const userService = require('../../src/services/user.service');
const userRepository = require('../../src/repositories/user.repository');

jest.mock('../../src/repositories/user.repository');

describe('user.service', () => {
  describe('getProfile', () => {
    it('returns public profile when user exists', async () => {
      const mockUser = {
        id: 'user-uuid-1',
        name: 'Sarah',
        email: 'sarah@example.com',
        gender: 'female',
        created_at: new Date().toISOString(),
      };

      userRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getProfile(mockUser.id);

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('throws AppError 401 TOKEN_INVALID when user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.getProfile('non-existent-id')).rejects.toMatchObject({
        name: 'AppError',
        statusCode: 401,
        code: 'TOKEN_INVALID',
        message: 'Token does not belong to an existing user',
      });
    });
  });
});
