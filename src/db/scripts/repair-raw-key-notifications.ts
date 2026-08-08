/**
 * Repair notification rows whose title/body stored a RAW i18n KEY instead of
 * rendered text, e.g.
 *
 *   title: { en: "messages.notification_templates.…_admin.title", ar: <same> }
 *
 * Why: TranslationService.renderStatic() falls back to `defaultValue: key` when a
 * catalogue lookup misses. On 2026-08-05 the driver-assignment cron fired against
 * a server whose messages.json did not yet carry `notification_templates.*` — the
 * code and its catalogue entries shipped together in 23faee7, which deployed
 * ~12 minutes AFTER the affected rows were written. Every render therefore missed
 * and persisted the key into BOTH language slots.
 *
 * The keys resolve correctly now, so no new rows are affected — this is a one-off
 * repair of the 2026-08-05 window.
 *
 * How:
 *  1. Parse the stored key back to its catalogue path (strip the `messages.`
 *     prefix that renderStatic prepends, and the trailing `.title` / `.body`).
 *  2. Recover the lost `{ref}` interpolation arg from the row's own redirect_id,
 *     which points at the order the notification is about. Nothing is guessed:
 *     a row is only rewritten when its order and reference_number both resolve.
 *  3. Re-render en + ar straight from the catalogue — identical to what the
 *     runtime produces today.
 *
 * Idempotent: only touches rows whose title->>'en' still starts with 'messages.'.
 * Safe to re-run.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register --project tsconfig.json \
 *     src/db/scripts/repair-raw-key-notifications.ts            # DRY RUN
 *   ... repair-raw-key-notifications.ts --apply                 # EXECUTE
 */
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}
const APPLY = process.argv.includes('--apply');

/** renderStatic() prefixes catalogue lookups with the messages.json file namespace. */
const KEY_PREFIX = 'messages.';

interface TranslationObject {
  en: string;
  ar: string;
}
interface Row {
  id: string;
  title: TranslationObject | null;
  body: TranslationObject | null;
  reference_number: string | null;
}

type CatNode = { [k: string]: string | CatNode };

function loadCatalogue(lang: 'en' | 'ar'): CatNode {
  const raw = readFileSync(join(process.cwd(), `src/i18n/${lang}/messages.json`), 'utf8');
  return JSON.parse(raw) as CatNode;
}
const CAT: Record<'en' | 'ar', CatNode> = { en: loadCatalogue('en'), ar: loadCatalogue('ar') };

/** Resolve a dotted catalogue path to its template string, or null. */
function lookup(lang: 'en' | 'ar', path: string): string | null {
  let node: string | CatNode | undefined = CAT[lang];
  for (const part of path.split('.')) {
    if (typeof node !== 'object' || node === null) return null;
    node = node[part];
  }
  return typeof node === 'string' ? node : null;
}

/** nestjs-i18n uses string-format, i.e. single-brace {name} placeholders. */
function render(tpl: string, args: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (whole, name: string) => args[name] ?? whole);
}

/** A stored value is broken when it is still the raw key renderStatic fell back to. */
function isRawKey(value: string | undefined): value is string {
  return typeof value === 'string' && value.startsWith(KEY_PREFIX);
}

/** Strip the file-namespace prefix to get the path into messages.json. */
function toCataloguePath(storedKey: string): string {
  return storedKey.slice(KEY_PREFIX.length);
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    // reference_number comes from the order the notification points at — this is
    // the only surviving source for the {ref} arg that was lost at write time.
    const { rows } = await pool.query<Row>(`
      SELECT n.id, n.title, n.body, o.reference_number
      FROM notifications n
      LEFT JOIN orders o ON o.id = n.redirect_id::uuid
      WHERE n.title->>'en' LIKE '${KEY_PREFIX}%'
         OR n.body->>'en'  LIKE '${KEY_PREFIX}%'
    `);
    console.log(`Fetched ${rows.length} row(s) holding a raw key.`);

    interface Plan {
      id: string;
      title?: TranslationObject;
      body?: TranslationObject;
    }
    const plans: Plan[] = [];
    const skipped: { id: string; why: string }[] = [];
    const byKey = new Map<string, number>();

    for (const r of rows) {
      const args: Record<string, string> = {};
      if (r.reference_number) args.ref = r.reference_number;

      const plan: Plan = { id: r.id };
      let blocked: string | null = null;

      for (const field of ['title', 'body'] as const) {
        const stored = r[field]?.en;
        if (!isRawKey(stored)) continue;

        const path = toCataloguePath(stored);
        const en = lookup('en', path);
        const ar = lookup('ar', path);

        if (en === null || ar === null) {
          blocked = `catalogue miss for "${path}"`;
          break;
        }
        // Only rewrite when every placeholder the template needs is available;
        // a half-filled body ("Order  was not accepted…") would be worse than
        // leaving the row for a human to look at.
        const missing = [...en.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((n) => !(n in args));
        if (missing.length > 0) {
          blocked = `missing arg(s) ${missing.join(', ')} (no reference_number)`;
          break;
        }

        byKey.set(path, (byKey.get(path) ?? 0) + 1);
        plan[field] = { en: render(en, args), ar: render(ar, args) };
      }

      if (blocked) {
        skipped.push({ id: r.id, why: blocked });
        continue;
      }
      if (plan.title || plan.body) plans.push(plan);
    }

    console.log(`\nResolved ${plans.length} row(s); skipped ${skipped.length}.`);
    if (byKey.size > 0) {
      console.log('\nFields repaired per catalogue key:');
      [...byKey.entries()]
        .sort((a, b) => b[1] - a[1])
        .forEach(([k, n]) => console.log(`  ${String(n).padStart(5)}  ${k}`));
    }
    if (skipped.length > 0) {
      console.log('\nSKIPPED (left untouched):');
      skipped.slice(0, 20).forEach((s) => console.log(`  • ${s.id} — ${s.why}`));
      if (skipped.length > 20) console.log(`  … and ${skipped.length - 20} more`);
    }

    const sample = plans[0];
    if (sample) {
      console.log('\nSample rewrite:');
      console.log(JSON.stringify(sample, null, 2));
    }

    if (!APPLY) {
      console.log('\n--- DRY RUN — no writes. Re-run with --apply to execute. ---');
      return;
    }

    let updated = 0;
    for (const p of plans) {
      const sets: string[] = [];
      const params: unknown[] = [];
      if (p.title) {
        params.push(JSON.stringify(p.title));
        sets.push(`title = $${params.length}::jsonb`);
      }
      if (p.body) {
        params.push(JSON.stringify(p.body));
        sets.push(`body = $${params.length}::jsonb`);
      }
      params.push(p.id);
      await pool.query(
        `UPDATE notifications SET ${sets.join(', ')} WHERE id = $${params.length}`,
        params,
      );
      updated++;
    }
    console.log(`\nUpdated ${updated} row(s).`);
  } finally {
    await pool.end();
  }
}

void main();
