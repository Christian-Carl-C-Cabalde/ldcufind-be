import db from '../../config/db.js';

export const getDashboardStats = async () => {
    const [pendingRows]: any = await db.query(
        "SELECT COUNT(*) as count FROM claims WHERE status = 'pending'"
    );
    const [activeRows]: any = await db.query(
        "SELECT COUNT(*) as count FROM items WHERE status = 'Available'"
    );
    const [settledRows]: any = await db.query(
        "SELECT COUNT(*) as count FROM claims WHERE status = 'verified'"
    );

    return {
        pendingClaims: pendingRows[0].count,
        activeListings: activeRows[0].count,
        settledItems: settledRows[0].count,
    };
};

export const getSubmissionTrends = async () => {
    const [rows] = await db.query(`
        SELECT 
            DAYNAME(created_at) as day,
            COUNT(*) as count
        FROM items
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DAYNAME(created_at), DAYOFWEEK(created_at)
        ORDER BY DAYOFWEEK(created_at)
    `);
    return rows;
};
