import db from './src/config/db.js';

async function check() {
    try {
        const [rows] = await db.query('SELECT * FROM items');
        console.log("ITEMS:");
        console.log(rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
