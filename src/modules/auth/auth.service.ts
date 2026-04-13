import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import db from '../../config/db.js';
import dotenv from 'dotenv';
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
    text: `Hello, here is your OTP code for LDCUFind: ${otp}. It will expire in 10 minutes.`
  };

  return transporter.sendMail(mailOptions);
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

  const [rows]: any = await db.query(`SELECT * FROM ${table} WHERE email = ? AND password = ?`, [email, password]);
  return rows[0];
};
