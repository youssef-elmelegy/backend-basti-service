/* eslint-disable @typescript-eslint/no-base-to-string */
import { config } from 'dotenv';
import { Pool } from 'pg';
import { Credentials, Translator } from '@translated/lara';

config();

// Load env directly to get access to LARA keys and DATABASE_URL
// We use process.env here for simplicity in a standalone script,
// ensuring LARA keys are present.
const LARA_ACCESS_KEY_ID = process.env.LARA_ACCESS_KEY_ID;
const LARA_ACCESS_KEY_SECRET = process.env.LARA_ACCESS_KEY_SECRET;
const DATABASE_URL = process.env.DATABASE_URL;

if (!LARA_ACCESS_KEY_ID || !LARA_ACCESS_KEY_SECRET || !DATABASE_URL) {
  console.error('Missing required environment variables (LARA keys or DATABASE_URL)');
  process.exit(1);
}

const credentials = new Credentials(LARA_ACCESS_KEY_ID, LARA_ACCESS_KEY_SECRET);
const lara = new Translator(credentials);

const migrations = [
  { table: 'addons', columns: ['name', 'description'] },
  { table: 'bakeries', columns: ['name', 'location_description'] },
  { table: 'chefs', columns: ['specialization', 'bio'] },
  { table: 'decorations', columns: ['title', 'description'] },
  { table: 'featured_cakes', columns: ['name', 'description'] },
  { table: 'flavors', columns: ['title', 'description'] },
  { table: 'notifications', columns: ['title', 'body'] },
  { table: 'predesigned_cakes', columns: ['name', 'description'] },
  { table: 'regions', columns: ['name'] },
  { table: 'shapes', columns: ['title', 'description'] },
  { table: 'slider_images', columns: ['title'] },
  { table: 'sweets', columns: ['name', 'description'] },
  { table: 'tags', columns: ['name'] },
];

async function translateToArabic(text: string): Promise<string> {
  if (!text || text.trim() === '') return '';
  try {
    const res = await lara.translate(text, 'en', 'ar', {
      contentType: 'text/plain',
      style: 'fluid',
      timeoutInMillis: 10000,
      priority: 'normal',
    });
    return res.translation;
  } catch (err) {
    console.error(
      `   ✗ Translation failed for: "${text.substring(0, 30)}..."`,
      err instanceof Error ? err.message : err,
    );
    return ''; // Fallback to empty string
  }
}

async function migrateTranslations(): Promise<void> {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    for (const { table, columns } of migrations) {
      const tableCheck = await pool.query<{ exists: string | null }>(
        `SELECT to_regclass('public."${table}"') AS exists`,
      );

      if (!tableCheck.rows[0]?.exists) {
        console.log(`Table "${table}" does not exist, skipping...`);
        continue;
      }

      for (const column of columns) {
        const colCheck = await pool.query<{ data_type: string }>(
          `SELECT data_type FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
          [table, column],
        );

        if (colCheck.rows.length === 0) {
          console.log(`Column "${column}" does not exist in table "${table}", skipping...`);
          continue;
        }

        const dataType = colCheck.rows[0].data_type;

        if (dataType === 'character varying' || dataType === 'text') {
          console.log(`Migrating ${table}.${column} to jsonb with translations...`);

          // 1. Fetch all rows
          const rows = await pool.query<{ id: string; [key: string]: string }>(
            `SELECT id, "${column}" FROM "${table}" WHERE "${column}" IS NOT NULL`,
          );

          console.log(`   Found ${rows.rows.length} rows to translate for ${table}.${column}`);

          // 2. Translate and update each row
          // We do this outside a single big transaction if there are many rows,
          // but for this script we'll just process them.
          for (const row of rows.rows) {
            const englishText = row[column];

            let arabicText: string;
            // skip notifications translations (soooo many)
            if (table === 'notifications') {
              arabicText = englishText;
            } else {
              arabicText = await translateToArabic(englishText);
            }

            const translationObject = {
              en: englishText,
              ar: arabicText,
            };

            await pool.query(`UPDATE "${table}" SET "${column}" = $1 WHERE id = $2`, [
              JSON.stringify(translationObject),
              row.id,
            ]);
          }

          // 3. Alter column type to jsonb
          await pool.query('BEGIN');
          try {
            // Drop default if exists
            await pool.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT`);

            // Change type and cast existing (now JSON strings) to jsonb
            await pool.query(`
              ALTER TABLE "${table}"
              ALTER COLUMN "${column}"
              TYPE jsonb
              USING "${column}"::jsonb
            `);

            // Set the new default value
            await pool.query(
              `ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '{"en": "", "ar": ""}'::jsonb`,
            );

            // Enforce NOT NULL constraint
            await pool.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET NOT NULL`);

            await pool.query('COMMIT');
            console.log(`   ✓ ${table}.${column} migrated successfully.`);
          } catch (alterErr) {
            await pool.query('ROLLBACK');
            throw alterErr;
          }
        } else if (dataType === 'jsonb' || dataType === 'json') {
          console.log(`Column ${table}.${column} is already jsonb/json, skipping...`);
        } else {
          console.log(`Column ${table}.${column} has unexpected type ${dataType}, skipping...`);
        }
      }
    }

    console.log('✓ All translations migrated successfully');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('✗ Migration failed:', message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void migrateTranslations();
