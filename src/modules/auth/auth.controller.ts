import type { Context } from 'hono';
import * as authService from './auth.service.js';
import db from '../../config/db.js';
import bcrypt from 'bcrypt';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import jwt from 'jsonwebtoken';

export const register = async (c: Context) => {
  try {
    const { name, email, password } = await c.req.json();

    if (!name || !email || !password) {
      return c.json({ message: 'Name, email, and password are required' }, 400);
    }

    if (!email.toLowerCase().endsWith('@liceo.edu.ph')) {
      return c.json({ message: 'Only @liceo.edu.ph emails are allowed' }, 400);
    }

    // Check if user already exists
    const [existingUsers]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return c.json({ message: 'This email is already used' }, 400);
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

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user since OTP is verified
    await db.query(
      'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'Student', true]
    );

    return c.json({ message: 'User registered successfully. Please login.' });
  } catch (error: any) {

    console.error('OTP verification error:', error);
    return c.json({ message: 'Failed to verify OTP', error: error.message }, 500);
  }
};

export const resendOtp = async (c: Context) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ message: 'Email is required' }, 400);
    }

    const otp = authService.generateOTP();
    await authService.saveOTP(email, otp);
    await authService.sendOTPEmail(email, otp);

    return c.json({ message: 'OTP sent to your email' }, 200);
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return c.json({ message: 'Failed to resend OTP', error: error.message }, 500);
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

    setCookie(c, 'ldcufind_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return c.json({
      message: 'Login successful'
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return c.json({ message: 'Failed to login', error: error.message }, 500);
  }
};

export const forgotPassword = async (c: Context) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ message: 'Email is required' }, 400);
    }

    // EXPLICITLY check ONLY the users table to exclude admins from reset flow
    const [user]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (user.length === 0) {
      return c.json({ message: 'Email does not exist' }, 404);
    }

    const token = authService.generateResetToken();
    await authService.saveResetToken(email, token);

    // Create the reset link pointing to the frontend
    const resetLink = `http://localhost:4200/user/reset-password?token=${token}`;
    await authService.sendResetEmail(email, resetLink);

    return c.json({ message: 'Reset link sent successfully' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return c.json({ message: 'Failed to process request', error: error.message }, 500);
  }
};

export const resetPassword = async (c: Context) => {
  try {
    const { token, newPassword } = await c.req.json();

    if (!token || !newPassword) {
      return c.json({ message: 'Token and new password are required' }, 400);
    }

    const email = await authService.verifyResetToken(token);
    if (!email) {
      return c.json({ message: 'Invalid or expired reset token' }, 400);
    }

    // Check if new password is same as old
    const [userRows]: any = await db.query('SELECT password FROM users WHERE email = ?', [email]);
    if (userRows.length > 0) {
      const isSame = await bcrypt.compare(newPassword, userRows[0].password);
      if (isSame) {
        return c.json({ message: 'You can’t reuse your previous password' }, 400);
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update ONLY in the users table to enforce admin exclusion
    await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

    // Delete token ONLY after successful update
    await authService.deleteResetToken(email);

    return c.json({ message: 'Password has been reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return c.json({ message: 'Failed to reset password', error: error.message }, 500);
  }
};

export const getCurrentUser = async (c: Context) => {
  try {
    const token = getCookie(c, 'ldcufind_token');
    if (!token) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    let table = decoded.role === 'Admin' ? 'admins' : 'users';
    const [rows]: any = await db.query(`SELECT id, name, email, role, is_active FROM ${table} WHERE id = ?`, [decoded.id]);
    const user = rows[0];

    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }

    if (user.is_active !== undefined && user.is_active === 0) {
      return c.json({ message: 'Account is deactivated' }, 403);
    }

    return c.json({ user });
  } catch (error: any) {
    console.error('GetCurrentUser error:', error);
    return c.json({ message: 'Unauthorized', error: error.message }, 401);
  }
};

export const logout = async (c: Context) => {
  try {
    deleteCookie(c, 'ldcufind_token', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax'
    });
    return c.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return c.json({ message: 'Failed to logout', error: error.message }, 500);
  }
};

