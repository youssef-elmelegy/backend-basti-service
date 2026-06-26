/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
/**
 * Backfill bilingual { en, ar } title/body for EXISTING notification rows.
 *
 * Why: legacy rows (and the original migrate-translations.ts, which deliberately
 * skipped notifications) stored English in BOTH the `en` and `ar` columns. The
 * list endpoint localizes by Accept-Language, so those rows always render English
 * even for `ar` clients. This fills the `ar` side.
 *
 * How (NO machine-translation / no Lara):
 *  1. Load the `notification_templates` catalogue (en + ar) — the single source
 *     of truth ("our constant types").
 *  2. Auto-derive a reverse matcher from every catalogue entry. For each legacy
 *     row, match its English body against the catalogue, extract the args
 *     ({ref}, {statusLabel}, {code}, {reason}, …) and re-render BOTH languages
 *     straight from the catalogue. Deterministic, free, and identical to what the
 *     runtime now produces.
 *  3. Genuinely custom/junk text (admin "test" notifications, seed examples) is
 *     translated from a hand-written map below — still no API.
 *
 * Idempotent: only touches a column when its `ar` is missing/empty or identical
 * to `en` (the legacy signature). Safe to re-run.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register --project tsconfig.json \
 *     src/db/scripts/backfill-notification-translations.ts            # DRY RUN
 *   ... backfill-notification-translations.ts --apply                 # EXECUTE
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

interface TranslationObject {
  en: string;
  ar: string;
}
interface Row {
  id: string;
  title: TranslationObject | null;
  body: TranslationObject | null;
}

// ---------------------------------------------------------------------------
// Catalogue ("our constant types")
// ---------------------------------------------------------------------------
type CatNode = { [k: string]: string | CatNode };
function loadCatalogue(lang: 'en' | 'ar'): CatNode {
  const raw = readFileSync(join(process.cwd(), `src/i18n/${lang}/messages.json`), 'utf8');
  return JSON.parse(raw).notification_templates as CatNode;
}
const EN = loadCatalogue('en');
const AR = loadCatalogue('ar');

const EN_STATUS = EN.status_label as Record<string, string>;
const AR_STATUS = AR.status_label as Record<string, string>;
function statusLabel(value: string, lang: 'en' | 'ar'): string {
  const key = value === 'canceled' ? 'cancelled' : value;
  const map = lang === 'en' ? EN_STATUS : AR_STATUS;
  return map[key] ?? value;
}

/** A catalogue "unit" = a node carrying both a title and a body string. */
interface Unit {
  path: string;
  titleEn: string;
  bodyEn: string;
  titleAr: string;
  bodyAr: string;
  bodyRe: RegExp;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/** Turn an English template into an anchored regex with named capture groups. */
function templateToRegex(tpl: string): RegExp {
  const escaped = escapeRe(tpl).replace(/\\\{(\w+)\\\}/g, '(?<$1>[\\s\\S]+?)');
  return new RegExp(`^${escaped}$`);
}

function collectUnits(en: CatNode, ar: CatNode, path: string[] = []): Unit[] {
  const units: Unit[] = [];
  for (const key of Object.keys(en)) {
    const e = en[key];
    const a = ar?.[key] ?? {};
    if (e && typeof e === 'object' && typeof e.title === 'string' && typeof e.body === 'string') {
      const titleEn = e.title;
      const bodyEn = e.body;
      const titleAr = typeof a === 'object' && typeof a.title === 'string' ? a.title : titleEn;
      const bodyAr = typeof a === 'object' && typeof a.body === 'string' ? a.body : bodyEn;
      units.push({
        path: [...path, key].join('.'),
        titleEn,
        bodyEn,
        titleAr,
        bodyAr,
        bodyRe: templateToRegex(bodyEn),
      });
    } else if (e && typeof e === 'object') {
      units.push(...collectUnits(e, typeof a === 'object' ? a : {}, [...path, key]));
    }
  }
  return units;
}

// Match more-specific (longer) templates first so e.g. the "... — reason: {reason}."
// variant wins over the plain "...{ref}." variant.
const UNITS = collectUnits(EN, AR).sort((a, b) => b.bodyEn.length - a.bodyEn.length);

function renderArg(name: string, value: string, lang: 'en' | 'ar'): string {
  if (name === 'statusLabel') return statusLabel(value, lang);
  if (name === 'customer' && value === 'a customer') return lang === 'ar' ? 'أحد العملاء' : value;
  return value;
}
function render(tpl: string, args: Record<string, string>, lang: 'en' | 'ar'): string {
  return tpl.replace(/\{(\w+)\}/g, (_, name: string) => renderArg(name, args[name] ?? '', lang));
}

/** Full resolve: returns rendered en+ar for both title and body, or null. */
function resolveRow(bodyEn: string): {
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
} | null {
  for (const u of UNITS) {
    const m = u.bodyRe.exec(bodyEn);
    if (m) {
      const args = (m.groups ?? {}) as Record<string, string>;
      return {
        titleEn: render(u.titleEn, args, 'en'),
        titleAr: render(u.titleAr, args, 'ar'),
        bodyEn: render(u.bodyEn, args, 'en'),
        bodyAr: render(u.bodyAr, args, 'ar'),
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Hand-written Arabic for genuinely custom / seed / junk strings (no API).
// Keyed by the exact English string.
// ---------------------------------------------------------------------------
const CUSTOM_AR: Record<string, string> = {
  // seed example notification (from the DTO @ApiProperty examples)
  'Your order is on the way!': 'طلبك في الطريق!',
  'Your cake order #123 is now out for delivery.':
    'طلب الكيك رقم ‎#123 الخاص بك في طريقه إليك الآن.',
  // ad-hoc admin test notifications
  test: 'اختبار',
  aloo: 'ألو',
  titlle: 'عنوان',
  titlte: 'عنوان',
  title: 'عنوان',
  body: 'المحتوى',
};

/**
 * Translate a single custom string to Arabic with no API: exact map first, then
 * a couple of parametric patterns that reuse the catalogue wording (e.g. coupon
 * titles created by SendCouponNotificationDialog with arbitrary codes).
 */
function customTranslate(en: string): string | null {
  if (CUSTOM_AR[en] !== undefined) return CUSTOM_AR[en];
  const coupon = en.match(/^New coupon: (.+)$/);
  if (coupon) return `كوبون جديد: ${coupon[1]}`;
  return null;
}

// ---------------------------------------------------------------------------

function needsBackfill(obj: TranslationObject | null): obj is TranslationObject {
  if (!obj || typeof obj.en !== 'string' || obj.en.trim() === '') return false;
  return !obj.ar || obj.ar.trim() === '' || obj.ar === obj.en;
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const { rows } = await pool.query<Row>(`SELECT id, title, body FROM notifications`);
    console.log(`Fetched ${rows.length} notifications. Catalogue units: ${UNITS.length}.`);

    let viaTemplate = 0;
    let viaCustom = 0;
    const unresolved = new Set<string>();

    interface Plan {
      id: string;
      title?: TranslationObject;
      body?: TranslationObject;
    }
    const plans: Plan[] = [];

    for (const r of rows) {
      const tNeeds = needsBackfill(r.title);
      const bNeeds = needsBackfill(r.body);
      if (!tNeeds && !bNeeds) continue;

      const matched = resolveRow(r.body?.en ?? '');
      const plan: Plan = { id: r.id };

      if (matched) {
        viaTemplate++;
        if (tNeeds) plan.title = { en: matched.titleEn, ar: matched.titleAr };
        if (bNeeds) plan.body = { en: matched.bodyEn, ar: matched.bodyAr };
      } else {
        // custom / junk — translate each side from the hand map
        let resolvedAny = false;
        if (tNeeds) {
          const en = r.title!.en;
          const ar = customTranslate(en);
          if (ar !== null) {
            plan.title = { en, ar };
            resolvedAny = true;
          } else {
            unresolved.add(en);
          }
        }
        if (bNeeds) {
          const en = r.body!.en;
          const ar = customTranslate(en);
          if (ar !== null) {
            plan.body = { en, ar };
            resolvedAny = true;
          } else {
            unresolved.add(en);
          }
        }
        if (resolvedAny) viaCustom++;
      }

      if (plan.title || plan.body) plans.push(plan);
    }

    console.log(`Rows resolved via TEMPLATE: ${viaTemplate}`);
    console.log(`Rows resolved via CUSTOM map: ${viaCustom}`);
    console.log(`Distinct UNRESOLVED strings (need a CUSTOM_AR entry): ${unresolved.size}`);
    if (unresolved.size > 0) {
      console.log('\nUNRESOLVED:');
      [...unresolved].forEach((s) => console.log(`  • ${JSON.stringify(s)}`));
    }

    if (!APPLY) {
      console.log('\n--- DRY RUN — no writes. Re-run with --apply to execute. ---');
      console.log(`Would update ${plans.length} rows.`);
      return;
    }

    let updated = 0;
    for (const plan of plans) {
      const sets: string[] = [];
      const vals: unknown[] = [];
      let p = 1;
      if (plan.title) {
        sets.push(`title = $${p++}::jsonb`);
        vals.push(JSON.stringify(plan.title));
      }
      if (plan.body) {
        sets.push(`body = $${p++}::jsonb`);
        vals.push(JSON.stringify(plan.body));
      }
      if (sets.length === 0) continue;
      vals.push(plan.id);
      await pool.query(`UPDATE notifications SET ${sets.join(', ')} WHERE id = $${p}`, vals);
      updated++;
    }
    console.log(`\n✓ Updated ${updated} notification rows (no API calls used).`);
  } catch (err) {
    console.error('✗ Backfill failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
