import pool from './src/config/db.js';

async function update() {
  try {
    const [result] = await pool.query("UPDATE items SET status = 'Settled' WHERE name = 'test'");
    console.log('Update result:', result);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

update();
