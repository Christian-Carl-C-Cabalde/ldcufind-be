import { Hono } from 'hono';
import { loginAdmin } from './admin.controller.js';

const adminRoutes = new Hono();

// POST /api/admin/login
adminRoutes.post('/login', loginAdmin);

export default adminRoutes;