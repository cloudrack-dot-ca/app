import { pool } from '../server/db';
import { log } from '../server/vite';

async function runMigration() {
  const client = await pool.connect();

  try {
    log('Starting user suspension migration', 'migration');
    
    // Begin transaction
    await client.query('BEGIN');

    // Check if columns already exist
    const checkSuspendedColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_suspended'
    `);

    const checkReasonColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'suspension_reason'
    `);

    // Add is_suspended column if it doesn't exist
    if (checkSuspendedColumn.rows.length === 0) {
      log('Adding is_suspended column to users table', 'migration');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN is_suspended BOOLEAN NOT NULL DEFAULT FALSE
      `);
    } else {
      log('is_suspended column already exists', 'migration');
    }

    // Add suspension_reason column if it doesn't exist
    if (checkReasonColumn.rows.length === 0) {
      log('Adding suspension_reason column to users table', 'migration');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN suspension_reason TEXT
      `);
    } else {
      log('suspension_reason column already exists', 'migration');
    }

    // Commit transaction
    await client.query('COMMIT');
    log('User suspension migration completed successfully', 'migration');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    log(`Migration error: ${error}`, 'migration');
    throw error;
  } finally {
    client.release();
  }
}

// Execute the migration
runMigration().catch(console.error);