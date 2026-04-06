import db from '../../config/db.js';

export const findAllUsers = async () => {
    const [rows] = await db.query('SELECT * FROM users ORDER BY created_at DESC');
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
