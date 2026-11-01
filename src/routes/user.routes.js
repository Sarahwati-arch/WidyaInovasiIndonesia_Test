const { Router } = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');

const router = Router();

router.get('/me', authenticate, userController.getMe);

module.exports = router;
