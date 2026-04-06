import { Hono } from 'hono';
import { getStats, getTrends } from './dashboard.controller.js';

const dashboardRoutes = new Hono();

dashboardRoutes.get('/stats', getStats);     // GET /api/dashboard/stats
dashboardRoutes.get('/trends', getTrends);   // GET /api/dashboard/trends

export default dashboardRoutes;
