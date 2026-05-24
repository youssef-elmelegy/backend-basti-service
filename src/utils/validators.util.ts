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
