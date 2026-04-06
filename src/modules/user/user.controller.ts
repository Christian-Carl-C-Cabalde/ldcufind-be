import type { Context } from 'hono';
import { findAllUsers, findUserById, toggleUserStatus } from './user.model.js';

export const getUsers = async (c: Context) => {
    try {
        const users = await findAllUsers();
        return c.json(users, 200);
    } catch (error) {
        return c.json({ message: 'Failed to fetch users' }, 500);
    }
};

export const getUser = async (c: Context) => {
    try {
        const id = Number(c.req.param('id'));
        const user = await findUserById(id);

        if (!user) {
            return c.json({ message: 'User not found' }, 404);
        }

        return c.json(user, 200);
    } catch (error) {
        return c.json({ message: 'Failed to fetch user' }, 500);
    }
};

export const patchUserStatus = async (c: Context) => {
    try {
        const id = Number(c.req.param('id'));

        if (id >= 1000000) {
            return c.json({ message: 'System error: Cannot modify Master Admin privileges from this panel.' }, 403);
        }

        const existing = await findUserById(id);
        if (!existing) {
            return c.json({ message: 'User not found' }, 404);
        }

        await toggleUserStatus(id);
        const updated = await findUserById(id);

        return c.json({
            message: `User ${updated.is_active ? 'activated' : 'deactivated'} successfully`,
            user: updated
        }, 200);
    } catch (error) {
        return c.json({ message: 'Failed to update user status' }, 500);
    }
};
