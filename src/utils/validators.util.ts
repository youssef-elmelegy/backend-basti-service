import { db } from '@/db';
import { addons, featuredCakes, regions, tags } from '@/db/schema';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { errorResponse } from './response.handler';
import { eq } from 'drizzle-orm';

export async function validateTagExists(tagId: string): Promise<void> {
  if (!tagId) return;

  const [tagExists] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.id, tagId))
    .limit(1);

  if (!tagExists) {
    throw new BadRequestException(
      errorResponse(
        'routes.tags.not_found_with_id',
        HttpStatus.BAD_REQUEST,
        'BadRequestException',
        { tagId },
      ),
    );
  }
}

/**
 * Returns true when `tagId` points at a tag that no longer exists.
 *
 * Products keep their `tag_id` when a tag is force-deleted only until an admin
 * re-picks one, so the forms need to tell "no tag" apart from "tag vanished".
 */
export async function isTagMissing(tagId: string | null | undefined): Promise<boolean> {
  if (!tagId) return false;

  const [tagExists] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.id, tagId))
    .limit(1);

  return !tagExists;
}

/**
 * Tag validation for update paths.
 *
 * A record may already carry a stale `tag_id` (its tag was force-deleted), which
 * would make the record permanently unsaveable if we rejected every unknown id.
 * So an incoming id is validated only when it actually differs from the stored
 * one — re-submitting the stale value, or clearing it, is always allowed.
 */
export async function validateTagForUpdate(
  incomingTagId: string | null | undefined,
  currentTagId: string | null | undefined,
): Promise<void> {
  if (!incomingTagId) return;
  if (incomingTagId === currentTagId) return;

  await validateTagExists(incomingTagId);
}

export async function validateRegionExists(regionId: string): Promise<void> {
  const [regionExists] = await db
    .select({ id: regions.id })
    .from(regions)
    .where(eq(regions.id, regionId))
    .limit(1);

  if (!regionExists) {
    throw new BadRequestException(
      errorResponse(
        'routes.regions.not_found_with_id',
        HttpStatus.BAD_REQUEST,
        'BadRequestException',
        { regionId },
      ),
    );
  }
}

export async function validateAddonExists(addonId: string): Promise<void> {
  const [addonExists] = await db
    .select({ id: addons.id })
    .from(addons)
    .where(eq(addons.id, addonId))
    .limit(1);

  if (!addonExists) {
    throw new BadRequestException(
      errorResponse(
        `routes.addons.not_found_with_id`,
        HttpStatus.BAD_REQUEST,
        'BadRequestException',
        { addonId },
      ),
    );
  }
}

export async function validateCakeExists(cakeId: string): Promise<void> {
  const cakeResult = await db
    .select({ id: featuredCakes.id })
    .from(featuredCakes)
    .where(eq(featuredCakes.id, cakeId))
    .limit(1);

  if (cakeResult.length === 0) {
    throw new BadRequestException(
      errorResponse(
        'routes.featured_cakes.not_found',
        HttpStatus.BAD_REQUEST,
        'BadRequestException',
      ),
    );
  }
}
