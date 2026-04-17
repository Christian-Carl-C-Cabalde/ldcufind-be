import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import db from '../../config/db.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});



export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTPEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'LDCUFind Verification Code',
    text: `Hello, here is your OTP code for LDCUFind: ${otp}. It will expire in 10 minutes.`,
    html: `Hello, here is your OTP code for LDCUFind: <b>${otp}</b>. It will expire in 10 minutes.`
  };

  return transporter.sendMail(mailOptions);
};

export const sendResetEmail = async (email: string, link: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'LDCUFind Password Reset',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">Reset Your Password</h2>
        <p style="color: #475569; line-height: 1.6;">You requested a password reset for your LDCUFind account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #8b0000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 0.875rem;">This link will expire in 3 minutes. If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 0.75rem;">If the button doesn't work, copy and paste this link into your browser:<br/> ${link}</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const saveResetToken = async (email: string, token: string) => {
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes from now
  await db.query(
    'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
    [email, token, expiresAt]
  );
};

export const verifyResetToken = async (token: string) => {
  const [rows]: any = await db.query(
    'SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    [token]
  );

  if (rows.length > 0) {
    return rows[0].email;
  }
  return null;
};

export const deleteResetToken = async (email: string) => {
  await db.query('DELETE FROM password_resets WHERE email = ?', [email]);
};

export const saveOTP = async (email: string, code: string) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  await db.query(
    'INSERT INTO otps (email, code, expires_at) VALUES (?, ?, ?)',
    [email, code, expiresAt]
  );
};

export const verifyOTPInDb = async (email: string, code: string) => {
  const [rows]: any = await db.query(
    'SELECT * FROM otps WHERE email = ? AND code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    [email, code]
  );

  if (rows.length > 0) {
    // Delete OTP after successful verification to prevent reuse
    await db.query('DELETE FROM otps WHERE email = ?', [email]);
    return true;
  }
  return false;
};

export const generateToken = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '24h' });
};

export const verifyCredentials = async (email: string, password: string, role: string = 'Student') => {
  let table = 'users';
  if (role === 'Admin') {
    table = 'admins';
  }

  const [rows]: any = await db.query(`SELECT * FROM ${table} WHERE email = ?`, [email]);
  const user = rows[0];

  if (user && await bcrypt.compare(password, user.password)) {
    return user;
  }

  return null;
};

