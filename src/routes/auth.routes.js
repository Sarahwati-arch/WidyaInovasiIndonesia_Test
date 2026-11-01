const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { authRateLimiter } = require('../middlewares/rateLimiter');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = Router();

router.use(authRateLimiter);

router.post('/register', validate(registerSchema), authController.register);

router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
