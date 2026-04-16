import db from '../../config/db.js';

export const findAllUsers = async () => {
    const [rows]: any = await db.query(`
        SELECT id, name, email, role, is_active, created_at 
        FROM users 
        UNION ALL 
        SELECT (id + 1000000) as id, 'Master Admin' as name, email, 'Admin' as role, 1 as is_active, created_at 
        FROM admins
        ORDER BY created_at DESC
    `);
    return rows;
};

export const findUserById = async (id: number) => {
    const [rows]: any = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
};

export const toggleUserStatus = async (id: number) => {
    const [result] = await db.query(
        'UPDATE users SET is_active = NOT is_active WHERE id = ?',
        [id]
    );
    return result;
};

export const updateUserProfile = async (id: number, name: string) => {
    const [result] = await db.query(
        'UPDATE users SET name = ? WHERE id = ?',
        [name, id]
    );
    return result;
};

