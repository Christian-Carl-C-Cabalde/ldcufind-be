import { Hono } from 'hono';
import { getUsers, getUser, patchUserStatus } from './user.controller.js';

const userRoutes = new Hono();

userRoutes.get('/', getUsers);                  // GET   /api/users
userRoutes.get('/:id', getUser);                // GET   /api/users/:id
userRoutes.patch('/:id/status', patchUserStatus); // PATCH /api/users/:id/status

export default userRoutes;
