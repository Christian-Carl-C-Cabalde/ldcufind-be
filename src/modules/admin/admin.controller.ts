import type { Context } from 'hono';
import { findAdminByEmail } from './admin.model.js';

export const loginAdmin = async (c: Context) => {
    try {
        const { email, password } = await c.req.json();

        // 1. Check if admin exists
        const admin = await findAdminByEmail(email);

        if (!admin) {
            return c.json({ message: 'Admin not found' }, 404);
        }

        // 2. Compare password (Direct comparison)
        const isMatch = password === admin.password;

        if (!isMatch) {
            return c.json({ message: 'Invalid credentials' }, 401);
        }

        // 3. Success response
        return c.json({
            message: 'Login successful',
            admin: {
                id: admin.id,
                email: admin.email
            }
        }, 200);

    } catch (error) {
        return c.json({ message: 'Server error' }, 500);
    }
};