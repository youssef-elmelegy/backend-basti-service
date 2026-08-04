import { config } from 'dotenv';
import { Pool } from 'pg';

config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing required environment variable: DATABASE_URL');
  process.exit(1);
}

/**
 * Removes `bakery_item_stores` rows seeded against non-stockable region item
 * prices (decorations, flavors, shapes, predesigned cakes).
 *
 * Both seeding paths in `BakeryItemStoreService` used to fan out over every
 * priced item in a region regardless of kind, but only addons, sweets and
 * featured cakes can ever resolve to a product on read — the rest surfaced in
 * the dashboard as "Unknown Item" cards. The service now filters on write;
 * this script clears what the old behaviour already wrote.
 *
 * Dry run by default. Pass --apply to actually delete.
 */

const NON_STOCKABLE_PREDICATE = `
  rip.addon_id IS NULL
  AND rip.sweet_id IS NULL
  AND rip.featured_cake_id IS NULL
`;

async function cleanup(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    const { rows: breakdown } = await pool.query<{
      kind: string;
      row_count: string;
      with_stock: string;
    }>(`
      SELECT
        CASE
          WHEN rip.decoration_id IS NOT NULL THEN 'decoration'
          WHEN rip.flavor_id IS NOT NULL THEN 'flavor'
          WHEN rip.shape_id IS NOT NULL THEN 'shape'
          WHEN rip.predesigned_cake_id IS NOT NULL THEN 'predesigned_cake'
          ELSE 'unattributed'
        END AS kind,
        COUNT(*)::text AS row_count,
        COUNT(*) FILTER (
          WHERE bis.stock <> 0
             OR (bis.options IS NOT NULL AND bis.options <> '[]'::jsonb)
        )::text AS with_stock
      FROM bakery_item_stores bis
      JOIN region_item_prices rip ON rip.id = bis.region_item_price_id
      WHERE ${NON_STOCKABLE_PREDICATE}
      GROUP BY 1
      ORDER BY 1
    `);

    if (breakdown.length === 0) {
      console.log('✓ No non-stockable bakery item stores found. Nothing to do.');
      return;
    }

    let total = 0;
    let totalWithStock = 0;

    console.log('Non-stockable bakery item stores by item kind:');
    for (const row of breakdown) {
      const count = Number(row.row_count);
      const withStock = Number(row.with_stock);
      total += count;
      totalWithStock += withStock;
      const flag = withStock > 0 ? `  ⚠ ${withStock} carry non-zero stock` : '';
      console.log(`  ${row.kind.padEnd(18)} ${String(count).padStart(6)}${flag}`);
    }
    console.log(`  ${'TOTAL'.padEnd(18)} ${String(total).padStart(6)}`);

    // These rows should all be untouched zero-stock placeholders. Anything
    // else means a bakery recorded real stock against a customizer component,
    // which is data worth inspecting before it is thrown away.
    if (totalWithStock > 0) {
      console.error(
        `\n✗ Aborting: ${totalWithStock} row(s) carry non-zero stock. ` +
          'Inspect these before deleting — they are not safe to assume disposable.',
      );
      process.exitCode = 1;
      return;
    }

    if (!apply) {
      console.log(
        `\nDry run — no rows deleted. All ${total} row(s) are zero-stock placeholders.` +
          '\nRe-run with --apply to delete them.',
      );
      return;
    }

    const { rowCount } = await pool.query(`
      DELETE FROM bakery_item_stores bis
      USING region_item_prices rip
      WHERE rip.id = bis.region_item_price_id
        AND ${NON_STOCKABLE_PREDICATE}
        AND bis.stock = 0
        AND (bis.options IS NULL OR bis.options = '[]'::jsonb)
    `);

    console.log(`\n✓ Deleted ${rowCount ?? 0} non-stockable bakery item store(s).`);
  } finally {
    await pool.end();
  }
}

cleanup().catch((err) => {
  console.error('Cleanup failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
