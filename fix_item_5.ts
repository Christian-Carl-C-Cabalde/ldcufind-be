import pool from './src/config/db.js';

async function fix() {
  await pool.query("UPDATE items SET status = 'Settled' WHERE id = 5");
  process.exit(0);
}

fix();
