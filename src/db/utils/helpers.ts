import { and, eq, or, isNull, lte, gte, sql } from 'drizzle-orm';
import { offers } from '../schema';

/**
 * Reusable Drizzle condition to check if an offer is currently active.
 * Checks the boolean flag, and ensures the current time falls between
 * the start and expiry dates (accounting for nulls).
 */
export function isOfferActive(offerTable: typeof offers = offers) {
  return and(
    // must be active
    eq(offerTable.isActive, true),

    // start date is null OR in the past
    or(isNull(offerTable.startDate), lte(offerTable.startDate, sql`now()`)),

    // expiry date is null OR in the future
    or(isNull(offerTable.expiryDate), gte(offerTable.expiryDate, sql`now()`)),
  );
}
