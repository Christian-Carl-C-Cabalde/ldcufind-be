import db from '../../config/db.js';

export const findAllItems = async () => {
    const [rows]: any = await db.query('SELECT * FROM items ORDER BY created_at DESC');
    return rows;
};

export const findItemById = async (id: number) => {
    const [rows]: any = await db.query('SELECT * FROM items WHERE id = ?', [id]);
    return rows[0];
};

export const createItem = async (data: {
    name: string;
    description: string;
    location: string;
    date: string;
    image_url?: string;
    status?: string;
}) => {
    const [result] = await db.query(
        'INSERT INTO items (name, description, location, date, image_url, status) VALUES (?, ?, ?, ?, ?, ?)',
        [data.name, data.description, data.location, data.date, data.image_url || '/assets/icons/no-img.svg', data.status || 'Available']
    );
    return result;
};

export const updateItem = async (id: number, data: any) => {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = ['name', 'description', 'location', 'date', 'image_url', 'status'];
    
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            fields.push(`${field} = ?`);
            values.push(data[field]);
        }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const [result] = await db.query(
        `UPDATE items SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
    return result;
};

export const deleteItem = async (id: number) => {
    const [result] = await db.query('DELETE FROM items WHERE id = ?', [id]);
    return result;
};
