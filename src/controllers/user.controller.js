const userService = require('../services/user.service');
const { success } = require('../utils/response');

const getMe = async (req, res) => {
  const profile = await userService.getProfile(req.user.id);
  res.status(200).json(success(profile));
};

module.exports = { getMe };
