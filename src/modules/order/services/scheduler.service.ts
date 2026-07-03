import { Injectable, Logger } from '@nestjs/common';
import { GetDeliveryDateDto, GetDeliveryDateResponseDto } from '../dto';
import { ConfigService } from '@/modules/config/services/config.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  private readonly STORE_TIMEZONE = 'Libya';

  constructor(private readonly configService: ConfigService) {}

  async getDeliveryDate(
    getDeliveryDateDto: GetDeliveryDateDto,
  ): Promise<GetDeliveryDateResponseDto> {
    const { type, totalMinPrepHours } = getDeliveryDateDto;

    const config = await this.configService.get();

    const res = await this.calculateTheExpectedDeliveryTime(type, undefined, totalMinPrepHours);

    return {
      details: '',
      nearestDeliveryDate: res,
      configs: config,
    };
  }

  isClosedDay(
    date: dayjs.Dayjs,
    config: {
      weekendDays: number[];
      holidays: string[];
      emergencyClosures: { from: string; to: string; reason: string }[];
      isOpen: boolean;
    },
  ): boolean {
    // ensure the date is evaluated in the store's timezone
    const dateTz = date.tz(this.STORE_TIMEZONE);
    const dateStr = dateTz.format('YYYY-MM-DD');

    // global closure check
    if (!config.isOpen) {
      this.logger.log(`date ${dateStr} is closed because the bakery is globally closed`);
      return true;
    }

    // check if it's a weekend
    const dayOfWeek = dateTz.day(); // 0 (Sunday)
    if (config.weekendDays.includes(dayOfWeek)) {
      this.logger.log(`date ${dateStr} is closed because it's a weekend`);
      return true;
    }

    // check if it's a holiday
    if (config.holidays.includes(dateStr)) {
      this.logger.log(`date ${dateStr} is closed because it's a holiday`);
      return true;
    }

    // check if it's within an emergency closure period
    for (const closure of config.emergencyClosures) {
      // Parse strings directly into the correct timezone at start/end of day
      const fromDate = dayjs.tz(closure.from, this.STORE_TIMEZONE).startOf('day');
      const toDate = dayjs.tz(closure.to, this.STORE_TIMEZONE).endOf('day');

      if (dateTz.isSameOrAfter(fromDate) && dateTz.isSameOrBefore(toDate)) {
        this.logger.log(
          `date ${dateStr} is closed because it's within an emergency closure period`,
        );
        return true;
      }
    }

    return false;
  }

  async calculateTheExpectedDeliveryTime(
    type: 'big_cakes' | 'small_cakes' | 'others',
    wantedDate?: string,
    minPrepHours = 0,
  ): Promise<Date> {
    const config = await this.configService.get();

    // create current time strictly in the store's timezone
    const now = dayjs().tz(this.STORE_TIMEZONE);
    const currentHour = now.hour();

    const isTodayOpen = !this.isClosedDay(now, config);
    const isWorkingHours =
      isTodayOpen && currentHour >= config.openingHour && currentHour < config.closingHour;

    // base days for big cakes and small cakes
    const baseDays = type === 'big_cakes' ? 2 : 1;
    // number of days required for preparation
    const prepDaysFromItems = Math.ceil(Math.max(config.minHoursToPrepare, minPrepHours) / 24);

    // calculate minimum delivery date based on preparation time
    let minDeliveryDate = now.clone();
    let daysToAdd = type === 'others' ? 1 : isWorkingHours ? baseDays : baseDays + 1;
    daysToAdd = Math.max(daysToAdd, prepDaysFromItems);

    while (daysToAdd > 0) {
      if (!this.isClosedDay(minDeliveryDate, config)) {
        daysToAdd--;
      }
      minDeliveryDate = minDeliveryDate.add(1, 'day');
    }

    while (this.isClosedDay(minDeliveryDate, config)) {
      minDeliveryDate = minDeliveryDate.add(1, 'day');
    }

    // safely set the delivery hour
    minDeliveryDate = minDeliveryDate.hour(config.openingHour).minute(0).second(0).millisecond(0);

    //if wantedDate is provided, validate and use it
    if (wantedDate) {
      // parse wanted date strictly in the store's timezone
      let requestedDate = dayjs.tz(wantedDate, this.STORE_TIMEZONE);

      // check if requested date is valid
      if (!requestedDate.isValid()) {
        this.logger.warn(`Invalid wantedDate provided: ${wantedDate}`);
        return minDeliveryDate.toDate();
      }

      // check if requested date is same or after minimum delivery date
      // we check by 'day' to avoid minor millisecond/hour conflicts
      if (requestedDate.isSameOrAfter(minDeliveryDate, 'day')) {
        // if requested date is a closed day, find the next open day
        while (this.isClosedDay(requestedDate, config)) {
          requestedDate = requestedDate.add(1, 'day');
        }

        // ensure delivery is within working hours
        if (requestedDate.hour() < config.openingHour) {
          requestedDate = requestedDate.hour(config.openingHour).minute(0).second(0).millisecond(0);
        } else if (requestedDate.hour() >= config.closingHour) {
          requestedDate = requestedDate
            .hour(config.closingHour - 1)
            .minute(0)
            .second(0)
            .millisecond(0);
        }

        return requestedDate.toDate();
      }

      // if requested date is before minimum delivery date, use minimum
      this.logger.warn(
        `Requested date ${wantedDate} is before minimum delivery date. Using minimum.`,
      );
    }

    // convert back to native JavaScript Date for the return value
    return minDeliveryDate.toDate();
  }
}
