import { sql } from 'drizzle-orm';
import { db } from '../server/db';

async function main() {
  console.log('Running migration: add-documentation-relations');

  // Drop existing foreign key if exists
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'doc_articles_section_id_fkey'
      ) THEN
        ALTER TABLE doc_articles DROP CONSTRAINT doc_articles_section_id_fkey;
      END IF;
    END $$;
  `);

  // Add foreign key with cascade delete
  await db.execute(sql`
    ALTER TABLE doc_articles
    ADD CONSTRAINT doc_articles_section_id_fkey
    FOREIGN KEY (section_id)
    REFERENCES doc_sections(id)
    ON DELETE CASCADE;
  `);

  console.log('Migration completed successfully');
}

main()
  .catch(e => {
    console.error('Migration failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
