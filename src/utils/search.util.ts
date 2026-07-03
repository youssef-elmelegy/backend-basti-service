/**
 * Helpers for building safe free-text search patterns used with SQL
 * `LIKE` / `ILIKE`.
 *
 * NOTE: Drizzle already sends these values as bound parameters, so raw values
 * are NOT vulnerable to SQL injection. What these helpers prevent is
 * *wildcard injection* and abuse:
 *   - a user typing `%` or `_` silently turning their term into a
 *     match-anything / match-any-single-char pattern, and
 *   - unbounded search terms driving pathological full-table scans.
 *
 * Postgres `LIKE`/`ILIKE` treats backslash as the default escape character,
 * so escaping `%`, `_` and `\` here works without an explicit `ESCAPE` clause.
 */

/** Maximum number of characters accepted from a free-text search term. */
export const MAX_SEARCH_LENGTH = 100;

/**
 * Escapes `LIKE`/`ILIKE` wildcard metacharacters (`\`, `%`, `_`) so the term
 * matches literally instead of acting as a wildcard. Backslash must be escaped
 * first to avoid double-escaping the escapes we add for `%` and `_`.
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Builds a bounded, wildcard-escaped `%term%` substring pattern for
 * `LIKE`/`ILIKE`. Trims surrounding whitespace and clamps the length before
 * escaping.
 */
export function buildSearchPattern(term: string): string {
  const trimmed = term.trim().slice(0, MAX_SEARCH_LENGTH);
  return `%${escapeLikePattern(trimmed)}%`;
}
