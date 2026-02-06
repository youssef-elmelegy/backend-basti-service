import { Injectable, InternalServerErrorException, HttpStatus, Logger } from '@nestjs/common';
import { db } from '@/db';
import { cakes, addons } from '@/db/schema';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  /**
   * Get all unique tags from cakes and addons tables
   */
  async findAll(): Promise<SuccessResponse<string[]>> {
    try {
      const cakesData = await db.select({ tags: cakes.tags }).from(cakes);

      const addonsData = await db.select({ tags: addons.tags }).from(addons);

      const allTags = new Set<string>();

      cakesData.forEach((cake) => {
        if (cake.tags && Array.isArray(cake.tags)) {
          cake.tags.forEach((tag) => allTags.add(tag));
        }
      });

      addonsData.forEach((addon) => {
        if (addon.tags && Array.isArray(addon.tags)) {
          addon.tags.forEach((tag) => allTags.add(tag));
        }
      });

      const tags: string[] = Array.from(allTags).sort();

      this.logger.log(`Retrieved ${tags.length} unique tags`);

      return successResponse(tags, 'Tags retrieved successfully', HttpStatus.OK);
    } catch (error) {
      this.logger.error('Failed to retrieve tags', error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve tags',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
