const AppError = require('../utils/AppError');
const userRepository = require('../repositories/user.repository');

/** Return the public profile of a user. */
const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);

  // A valid token for a user that no longer exists is treated as an invalid token.
  if (!user) {
    throw AppError.unauthorized('Token does not belong to an existing user', 'TOKEN_INVALID');
  }

  return user;
};

module.exports = { getProfile };
