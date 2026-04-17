import type { Context } from 'hono';
import { findAllUsers, findUserById, toggleUserStatus, updateUserProfile } from './user.model.js';
import { io } from '../../index.js';

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

        // Guard: only standard (Student) users can have their status toggled
        if (existing.role === 'Admin') {
            return c.json({ message: 'Action not allowed: Cannot deactivate an admin account.' }, 403);
        }

        await toggleUserStatus(id);
        const updated = await findUserById(id);

        // Broadcast deactivation to all connected clients in real-time
        if (!updated.is_active) {
            io.emit('user-deactivated', { userId: id });
        }

        return c.json({
            message: `User ${updated.is_active ? 'activated' : 'deactivated'} successfully`,
            user: updated
        }, 200);
    } catch (error) {
        return c.json({ message: 'Failed to update user status' }, 500);
    }
};

export const patchUser = async (c: Context) => {
    try {
        const id = Number(c.req.param('id'));
        const { name, avatarUrl } = await c.req.json();

        const existing = await findUserById(id);
        if (!existing) {
            return c.json({ message: 'User not found' }, 404);
        }

        // Use new name or keep existing if not provided
        const finalName = name || existing.name;
        // Use new avatarUrl or keep existing if not provided
        const finalAvatarUrl = avatarUrl !== undefined ? avatarUrl : existing.avatar_url;

        await updateUserProfile(id, finalName, finalAvatarUrl);
        const updated = await findUserById(id);

        return c.json({
            message: 'Profile updated successfully',
            user: updated
        }, 200);
    } catch (error) {
        console.error('Update profile error:', error);
        return c.json({ message: 'Failed to update profile' }, 500);
    }
};

