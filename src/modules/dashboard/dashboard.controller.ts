import type { Context } from 'hono';
import { getDashboardStats, getSubmissionTrends } from './dashboard.model.js';

export const getStats = async (c: Context) => {
    try {
        const stats = await getDashboardStats();
        return c.json(stats, 200);
    } catch (error) {
        return c.json({ message: 'Failed to fetch dashboard stats' }, 500);
    }
};

export const getTrends = async (c: Context) => {
    try {
        const trends = await getSubmissionTrends();
        return c.json(trends, 200);
    } catch (error) {
        return c.json({ message: 'Failed to fetch submission trends' }, 500);
    }
};
