import { pool } from "../server/db.js";
import { fileURLToPath } from 'url';

export async function runMigration() {
  console.log("Running migration: add-github-token");

  try {
    // Check if the column already exists
    const checkColumnResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'github_token'
    `);

    if (checkColumnResult.rowCount === 0) {
      // Add the github_token column to the users table
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN github_token TEXT
      `);

      console.log("Successfully added github_token column to users table");
      return true;
    } else {
      console.log("github_token column already exists in users table");
      return false;
    }
  } catch (error) {
    console.error("Error adding github_token column:", error);
    throw error;
  }
}

// If this script is run directly, execute the migration
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await runMigration();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}
