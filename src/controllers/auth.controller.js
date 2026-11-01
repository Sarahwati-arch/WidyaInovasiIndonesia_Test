const authService = require('../services/auth.service');
const { success } = require('../utils/response');

const register = async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json(success(user));
};

module.exports = { register };
