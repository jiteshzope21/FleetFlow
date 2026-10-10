import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  registerCompanySchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validator.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

export const authRouter = Router();

authRouter.post(
  '/register',
  authLimiter,
  validateRequest({ body: registerCompanySchema }),
  AuthController.register
);

authRouter.post(
  '/login',
  authLimiter,
  validateRequest({ body: loginSchema }),
  AuthController.login
);

authRouter.post('/logout', authenticate, AuthController.logout);

authRouter.get('/me', authenticate, AuthController.me);

authRouter.post(
  '/forgot-password',
  authLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  AuthController.forgotPassword
);

authRouter.post(
  '/reset-password',
  authLimiter,
  validateRequest({ body: resetPasswordSchema }),
  AuthController.resetPassword
);
