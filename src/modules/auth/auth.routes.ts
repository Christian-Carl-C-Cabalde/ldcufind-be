import { Hono } from 'hono';
import * as authController from './auth.controller.js';

const authRoutes = new Hono();

// POST /api/auth/register - sends OTP
authRoutes.post('/register', authController.register);

// POST /api/auth/verify-otp - verifies OTP and creates user
authRoutes.post('/verify-otp', authController.verifyOtp);

// POST /api/auth/login - returns JWT
authRoutes.post('/login', authController.login);

export default authRoutes;
