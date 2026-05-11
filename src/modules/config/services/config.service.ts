import { Injectable, InternalServerErrorException, HttpStatus, Logger } from '@nestjs/common';
import { db } from '@/db';
import { appConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse } from '@/utils';
import { UpdateConfigDto, ConfigResponseDto } from '../dto';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  async get(): Promise<ConfigResponseDto> {
    try {
      let [config] = await db.select().from(appConfig).limit(1);

      if (!config) {
        this.logger.log('No config found, seeding default config');
        [config] = await db.insert(appConfig).values({}).returning();
      }

      return this.mapToResponse(config);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve config: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.config.failed_retrieve',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async update(updateDto: UpdateConfigDto): Promise<ConfigResponseDto> {
    try {
      let [config] = await db.select().from(appConfig).limit(1);

      if (!config) {
        this.logger.log('No config found, seeding default config before update');
        [config] = await db.insert(appConfig).values({}).returning();
      }

      const [updated] = await db
        .update(appConfig)
        .set({
          ...(updateDto.openingHour !== undefined && { openingHour: updateDto.openingHour }),
          ...(updateDto.closingHour !== undefined && { closingHour: updateDto.closingHour }),
          ...(updateDto.minHoursToPrepare !== undefined && {
            minHoursToPrepare: updateDto.minHoursToPrepare,
          }),
          ...(updateDto.weekendDays !== undefined && { weekendDays: updateDto.weekendDays }),
          ...(updateDto.holidays !== undefined && { holidays: updateDto.holidays }),
          ...(updateDto.emergencyClosures !== undefined && {
            emergencyClosures: updateDto.emergencyClosures,
          }),
          ...(updateDto.isOpen !== undefined && { isOpen: updateDto.isOpen }),
          ...(updateDto.closureMessage !== undefined && {
            closureMessage: updateDto.closureMessage,
          }),
          ...(updateDto.bastiPercentage !== undefined && {
            bastiPercentage: updateDto.bastiPercentage.toFixed(2),
          }),
          ...(updateDto.deliveryAmount !== undefined && {
            deliveryAmount: updateDto.deliveryAmount,
          }),
          updatedAt: new Date(),
        })
        .where(eq(appConfig.id, config.id))
        .returning();

      this.logger.log(`Config updated: ${updated.id}`);

      return this.mapToResponse(updated);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update config: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.config.failed_update',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private mapToResponse(config: typeof appConfig.$inferSelect): ConfigResponseDto {
    const sortedHolidays = config.holidays ? [...config.holidays].sort() : [];
    return {
      id: config.id,
      openingHour: config.openingHour,
      closingHour: config.closingHour,
      minHoursToPrepare: config.minHoursToPrepare,
      weekendDays: config.weekendDays,
      holidays: sortedHolidays,
      emergencyClosures: config.emergencyClosures,
      isOpen: config.isOpen,
      closureMessage: config.closureMessage || '',
      bastiPercentage: parseFloat(config.bastiPercentage),
      deliveryAmount: config.deliveryAmount,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}
