import type { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { getCookie } from 'hono/cookie';

export const authMiddleware = async (c: Context, next: Next) => {
  const token = getCookie(c, 'ldcufind_token');

  if (!token) {
    return c.json({ message: 'Unauthorized: No token provided' }, 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    c.set('user', decoded);
    await next();
  } catch (error) {
    return c.json({ message: 'Unauthorized: Invalid or expired token' }, 401);
  }
};
