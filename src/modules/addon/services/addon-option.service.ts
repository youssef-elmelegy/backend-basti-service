import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { addonOptions, addons } from '@/db/schema';
import { errorResponse, successResponse } from '@/utils';
import { CreateAddonOptionDto, UpdateAddonOptionDto } from '../dto';

@Injectable()
export class AddonOptionService {
  private readonly logger = new Logger(AddonOptionService.name);

  private async ensureAddonExists(addonId: string) {
    const [addon] = await db
      .select({ id: addons.id })
      .from(addons)
      .where(eq(addons.id, addonId))
      .limit(1);

    if (!addon) {
      throw new NotFoundException(
        errorResponse('Add-on not found', HttpStatus.NOT_FOUND, 'NotFound'),
      );
    }
  }

  async addOption(addonId: string, createAddonOptionDto: CreateAddonOptionDto) {
    try {
      await this.ensureAddonExists(addonId);

      const [createdOption] = await db
        .insert(addonOptions)
        .values({
          addonId,
          type: createAddonOptionDto.type,
          label: createAddonOptionDto.label,
          value: createAddonOptionDto.value,
          imageUrl: createAddonOptionDto.imageUrl,
        })
        .returning();

      this.logger.log(`Add-on option created: ${createdOption.id} for add-on: ${addonId}`);

      return successResponse(
        createdOption,
        'Add-on option created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create add-on option: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to create add-on option', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async updateOption(
    addonId: string,
    optionId: string,
    updateAddonOptionDto: UpdateAddonOptionDto,
  ) {
    try {
      await this.ensureAddonExists(addonId);

      const [existingOption] = await db
        .select()
        .from(addonOptions)
        .where(and(eq(addonOptions.id, optionId), eq(addonOptions.addonId, addonId)))
        .limit(1);

      if (!existingOption) {
        throw new NotFoundException(
          errorResponse('Add-on option not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      if (
        updateAddonOptionDto.type === undefined &&
        updateAddonOptionDto.label === undefined &&
        updateAddonOptionDto.value === undefined &&
        updateAddonOptionDto.imageUrl === undefined
      ) {
        throw new BadRequestException(
          errorResponse(
            'No fields provided to update',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const [updatedOption] = await db
        .update(addonOptions)
        .set({
          ...(updateAddonOptionDto.type !== undefined ? { type: updateAddonOptionDto.type } : {}),
          ...(updateAddonOptionDto.label !== undefined
            ? { label: updateAddonOptionDto.label }
            : {}),
          ...(updateAddonOptionDto.value !== undefined
            ? { value: updateAddonOptionDto.value }
            : {}),
          ...(updateAddonOptionDto.imageUrl !== undefined
            ? { imageUrl: updateAddonOptionDto.imageUrl }
            : {}),
        })
        .where(eq(addonOptions.id, optionId))
        .returning();

      this.logger.log(`Add-on option updated: ${optionId}`);

      return successResponse(updatedOption, 'Add-on option updated successfully');
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update add-on option: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to update add-on option', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async removeOption(addonId: string, optionId: string) {
    try {
      await this.ensureAddonExists(addonId);

      const [existingOption] = await db
        .select({ id: addonOptions.id })
        .from(addonOptions)
        .where(and(eq(addonOptions.id, optionId), eq(addonOptions.addonId, addonId)))
        .limit(1);

      if (!existingOption) {
        throw new NotFoundException(
          errorResponse('Add-on option not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      await db
        .delete(addonOptions)
        .where(and(eq(addonOptions.id, optionId), eq(addonOptions.addonId, addonId)));

      this.logger.log(`Add-on option deleted: ${optionId}`);

      return successResponse(
        { message: 'Add-on option deleted successfully' },
        'Add-on option deleted successfully',
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete add-on option: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('Failed to delete add-on option', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }
}
