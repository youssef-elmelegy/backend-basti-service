import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GetDeliveryDateDto, GetDeliveryDateResponseDto, WantedDeliveryTimeSlotDto } from '../dto';
import { ConfigService } from '@/modules/config/services/config.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { ConfigResponseDto } from '@/modules/config/dto';

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
    const { totalMinPrepHours } = getDeliveryDateDto;

    const config = await this.configService.get();

    const res = await this.calculateTheExpectedDeliveryTime(
      undefined,
      undefined,
      totalMinPrepHours,
      config,
    );

    return {
      details: '',
      nearestDeliveryDate: res.nearestDeliveryDate,
      timeSlotRange: res.timeSlotRange,
      configs: config,
    };
  }

  isClosedDay(date: dayjs.Dayjs, config: ConfigResponseDto): boolean {
    // ensure the date is evaluated in the store's timezone
    const dateTz = date.tz(this.STORE_TIMEZONE);
    const dateStr = dateTz.format('YYYY-MM-DD');

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
      // parse strings directly into the correct timezone at start/end of day
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
    wantedDeliveryDate?: string,
    wantedDeliveryTimeSlot?: WantedDeliveryTimeSlotDto,
    minPrepHours = 0,
    conf?: ConfigResponseDto,
  ): Promise<{
    nearestDeliveryDate: Date;
    timeSlotRange: { from: string; to: string };
  }> {
    const config = conf ?? (await this.configService.get());

    // check if the store is closed to avoid unnecessary calculations
    if (!config.isOpen) {
      throw new BadRequestException('routes.common.store_is_closed');
    }

    const now = dayjs().tz(this.STORE_TIMEZONE);
    const deliveryDate = now.clone();

    // add the universal minimum preparation hours
    deliveryDate.add(config.minHoursToPrepare, 'hour');

    // add the order's minimum preparation hours
    deliveryDate.add(minPrepHours, 'hour');

    // set to the delivery date if possible
    if (wantedDeliveryDate) {
      const requestedDate = dayjs.tz(wantedDeliveryDate, this.STORE_TIMEZONE);
      if (requestedDate.isValid() && requestedDate.isSameOrAfter(deliveryDate, 'day')) {
        deliveryDate
          .set('year', requestedDate.year())
          .set('month', requestedDate.month())
          .set('date', requestedDate.date());
      }
    }

    // check if the delivery date's hour is within working hours:
    // if before opening hour, set to opening hour,
    // else if after closing hour, set to next day's opening hour
    if (deliveryDate.hour() > config.closingHour) {
      deliveryDate.add(1, 'day');
      deliveryDate
        .set('hour', config.openingHour)
        .set('minute', 0)
        .set('second', 0)
        .set('millisecond', 0);
    } else if (deliveryDate.hour() < config.openingHour) {
      deliveryDate
        .set('hour', config.openingHour)
        .set('minute', 0)
        .set('second', 0)
        .set('millisecond', 0);
    }

    // set to the requested delivery time slot if possible
    if (wantedDeliveryTimeSlot && wantedDeliveryTimeSlot.from) {
      const currentHour = deliveryDate.hour();
      const requestedHour = parseInt(wantedDeliveryTimeSlot.from);
      if (requestedHour >= currentHour && this.isWithinWorkingHours(requestedHour, config)) {
        deliveryDate.set('hour', requestedHour);
      }
    }

    while (this.isClosedDay(deliveryDate, config)) {
      deliveryDate
        .add(1, 'day')
        .set('hour', config.openingHour)
        .set('minute', 0)
        .set('second', 0)
        .set('millisecond', 0);
    }

    const timeSlotRange = {
      from: deliveryDate.hour().toString(),
      to: config.closingHour.toString(),
    };

    // set hour part in the date to 0 to avoid confusion when returning time slot range in the response,
    // as the time slot range is already provided separately
    deliveryDate.set('hour', 0);

    return {
      nearestDeliveryDate: deliveryDate.toDate(),
      timeSlotRange,
    };
  }

  private isWithinWorkingHours(hour: number, config: ConfigResponseDto) {
    return hour >= config.openingHour && hour < config.closingHour;
  }

  getCurrentTime() {
    return {
      libya: dayjs(new Date()).tz(this.STORE_TIMEZONE).format(),
      utc: dayjs(new Date()).utc().format(),
      local: dayjs(new Date()).local().format(),
    };
  }

  getLocalDateString(date: Date) {
    return dayjs(date).tz(this.STORE_TIMEZONE).format();
  }

  getLocalDateObject(date: Date) {
    return dayjs(date).tz(this.STORE_TIMEZONE);
  }
}
