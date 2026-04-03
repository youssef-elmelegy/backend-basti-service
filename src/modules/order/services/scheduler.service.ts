import { Injectable, Logger } from '@nestjs/common';
import { GetDeliveryDateDto, GetDeliveryDateResponseDto } from '../dto';
import { ConfigService } from '@/modules/config/services/config.service';

@Injectable()
export class SchedulerService {
  constructor(private readonly configService: ConfigService) {}

  private readonly logger = new Logger(SchedulerService.name);

  async getDeliveryDate(
    getDeliveryDateDto: GetDeliveryDateDto,
  ): Promise<GetDeliveryDateResponseDto> {
    const { type, totalCapacity, totalMinPrepHours } = getDeliveryDateDto;

    const res = await this.calculateTheExpectedDeliveryTime(
      type,
      undefined,
      totalMinPrepHours,
      totalCapacity,
    );
    const configs = await this.configService.get();

    return {
      details: '',
      nearestDeliveryDate: res,
      configs,
    };
  }

  isClosedDay(
    date: Date,
    config: {
      weekendDays: number[];
      holidays: string[];
      emergencyClosures: { from: string; to: string; reason: string }[];
      isOpen: boolean;
    },
  ): boolean {
    //?> global closure check
    if (!config.isOpen) {
      return true;
    }

    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];

    //?> check if it's a weekend
    if (config.weekendDays.includes(dayOfWeek)) {
      return true;
    }

    //?> check if it's a holiday
    if (config.holidays.includes(dateStr)) {
      return true;
    }

    //?> check if it's within an emergency closure period
    for (const closure of config.emergencyClosures) {
      const fromDate = new Date(closure.from);
      const toDate = new Date(closure.to);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);

      if (date >= fromDate && date <= toDate) {
        return true;
      }
    }

    return false;
  }

  async calculateTheExpectedDeliveryTime(
    type: 'big_cakes' | 'small_cakes' | 'others',
    wantedDate?: string,
    minPrepHours = 0,
    capacity?: number,
  ): Promise<Date> {
    const config = await this.configService.get();

    const currentHour = new Date().getHours();
    const isWorkingHours = currentHour >= config.openingHour && currentHour < config.closingHour;

    // base days for big cakes and small cakes
    const baseDays = type === 'big_cakes' ? 2 : 1;
    // number of days required for preparation
    const prepDaysFromItems = Math.ceil(Math.max(0, minPrepHours) / 24);

    // Calculate minimum delivery date based on preparation time
    const minDeliveryDate = new Date();
    let daysToAdd = type === 'others' ? 1 : isWorkingHours ? baseDays : baseDays + 1;
    daysToAdd = Math.max(daysToAdd, prepDaysFromItems);

    // dummy, until capacity effect on the order delivery time is known
    capacity = 1;
    daysToAdd *= capacity;

    while (daysToAdd > 0) {
      minDeliveryDate.setDate(minDeliveryDate.getDate() + 1);

      if (!this.isClosedDay(minDeliveryDate, config)) {
        daysToAdd--;
      }
    }

    while (this.isClosedDay(minDeliveryDate, config)) {
      minDeliveryDate.setDate(minDeliveryDate.getDate() + 1);
    }

    minDeliveryDate.setHours(config.openingHour, 0, 0, 0);

    //?> If wantedDate is provided, validate and use it
    if (wantedDate) {
      const requestedDate = new Date(wantedDate);

      //?> Check if requested date is valid
      if (isNaN(requestedDate.getTime())) {
        this.logger.warn(`Invalid wantedDate provided: ${wantedDate}`);
        return minDeliveryDate;
      }

      //?> Check if requested date is after minimum delivery date
      if (requestedDate >= minDeliveryDate) {
        //?> Check if requested date is not a closed day
        if (!this.isClosedDay(requestedDate, config)) {
          //?> Ensure delivery is within working hours
          if (requestedDate.getHours() < config.openingHour) {
            requestedDate.setHours(config.openingHour, 0, 0, 0);
          } else if (requestedDate.getHours() >= config.closingHour) {
            requestedDate.setHours(config.closingHour - 1, 0, 0, 0);
          }
          return requestedDate;
        } else {
          //?> If requested date is a closed day, find the next open day
          const adjustedDate = new Date(requestedDate);
          while (this.isClosedDay(adjustedDate, config)) {
            adjustedDate.setDate(adjustedDate.getDate() + 1);
          }
          adjustedDate.setHours(config.openingHour, 0, 0, 0);
          return adjustedDate;
        }
      }

      //?> Requested date is before minimum delivery date, use minimum
      this.logger.warn(
        `Requested date ${wantedDate} is before minimum delivery date. Using minimum.`,
      );
    }

    return minDeliveryDate;
  }
}
