import type { Context } from 'hono';
import * as authService from './auth.service.js';
import db from '../../config/db.js';

export const register = async (c: Context) => {
  try {
    const { name, email, password } = await c.req.json();

    if (!name || !email || !password) {
      return c.json({ message: 'Name, email, and password are required' }, 400);
    }

    // Check if user already exists
    const [existingUsers]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return c.json({ message: 'User already exists' }, 400);
    }

    const otp = authService.generateOTP();
    await authService.saveOTP(email, otp);
    await authService.sendOTPEmail(email, otp);

    return c.json({ message: 'OTP sent to your email' });
  } catch (error: any) {
    console.error('Registration error:', error);
    return c.json({ message: 'Failed to process registration', error: error.message }, 500);
  }
};

export const verifyOtp = async (c: Context) => {
  try {
    const { name, email, password, code } = await c.req.json();

    if (!email || !code) {
      return c.json({ message: 'Email and code are required' }, 400);
    }

    const isValid = await authService.verifyOTPInDb(email, code);
    if (!isValid) {
      return c.json({ message: 'Invalid or expired OTP' }, 400);
    }

    // Create the user since OTP is verified
    await db.query(
      'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, 'Student', true]
    );

    return c.json({ message: 'User registered successfully. Please login.' });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return c.json({ message: 'Failed to verify OTP', error: error.message }, 500);
  }
};

export const login = async (c: Context) => {
  try {
    const { email, password, role } = await c.req.json();

    if (!email || !password) {
      return c.json({ message: 'Email and password are required' }, 400);
    }

    const user = await authService.verifyCredentials(email, password, role);

    if (!user) {
      return c.json({ message: 'Invalid email or password' }, 401);
    }

    if (user.is_active === 0) {
      return c.json({ message: 'Account is deactivated' }, 403);
    }

    const token = authService.generateToken({
      id: user.id,
      email: user.email,
      role: user.role || role || 'Student'
    });

    return c.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name || (role === 'Admin' ? 'Admin' : 'Student'),
        email: user.email,
        role: user.role || role || 'Student'
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return c.json({ message: 'Failed to login', error: error.message }, 500);
  }
};
