import pool from './src/config/db.js';

async function checkItems() {
    try {
        const [rows] = await pool.query('SELECT id, name, status FROM items');
        console.log('Current items in DB:', JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error checking items:', error);
        process.exit(1);
    }
}

checkItems();
