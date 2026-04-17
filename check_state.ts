import pool from './src/config/db.js';

async function check() {
  try {
    const [items]: any = await pool.query('SELECT id, name, status FROM items');
    console.log('ITEMS IN DB:');
    console.log(items);
    
    const [claims]: any = await pool.query('SELECT id, item_id, status FROM claims');
    console.log('CLAIMS IN DB:');
    console.log(claims);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
