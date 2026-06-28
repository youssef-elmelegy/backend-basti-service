import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { GetOrdersFinancialsDto, GetOrdersFinancialsResponseDto } from '../dto';
import { db } from '@/db';
import { orders, bakeries } from '@/db/schema';
import { and, eq, gte, inArray, lte, SQL, desc, isNotNull } from 'drizzle-orm';
import { PAGINATION_DEFAULTS } from '@/constants/global.constants';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { TranslationService } from '@/common';

@Injectable()
export class FinancialsService {
  private readonly logger = new Logger(FinancialsService.name);

  constructor(private readonly translationService: TranslationService) {}

  async getOrdersFinancials(
    dto: GetOrdersFinancialsDto,
  ): Promise<SuccessResponse<GetOrdersFinancialsResponseDto>> {
    const { bakeryId, from, to, page, limit } = dto;
    return this.computeFinancials({
      bakeryId,
      from,
      to,
      page,
      limit,
      statuses: ['ready', 'out_for_delivery', 'delivered'],
      dateField: 'createdAt',
    });
  }

  async getBakeryFinancials(
    bakeryId: string,
    dto: GetOrdersFinancialsDto,
  ): Promise<SuccessResponse<GetOrdersFinancialsResponseDto>> {
    const { from, to, page, limit } = dto;
    return this.computeFinancials({
      bakeryId,
      from,
      to,
      page,
      limit,
      statuses: ['ready', 'out_for_delivery', 'delivered'],
      dateField: 'createdAt',
    });
  }

  private async computeFinancials(opts: {
    bakeryId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    statuses: (typeof orders.orderStatus.enumValues)[number][];
    dateField: 'deliveredAt' | 'createdAt';
  }): Promise<SuccessResponse<GetOrdersFinancialsResponseDto>> {
    const { bakeryId, from, to, page, limit, statuses, dateField } = opts;
    const dateColumn = dateField === 'createdAt' ? orders.createdAt : orders.deliveredAt;

    try {
      const conditions: SQL[] = [];

      if (bakeryId) {
        const [bakery] = await db
          .select({
            name: this.translationService.getLocalized(bakeries.name, 'name'),
          })
          .from(bakeries)
          .where(eq(bakeries.id, bakeryId))
          .limit(1);

        if (!bakery) {
          this.logger.warn(`Bakery with id: ${bakeryId} not found`);
          throw new NotFoundException(
            errorResponse('routes.bakery.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
          );
        }

        conditions.push(eq(orders.bakeryId, bakeryId));
      }

      if (from) {
        const fromCondition = and(isNotNull(dateColumn), gte(dateColumn, new Date(from)));
        if (fromCondition) conditions.push(fromCondition);
      }

      if (to) {
        const toCondition = and(isNotNull(dateColumn), lte(dateColumn, new Date(to)));
        if (toCondition) conditions.push(toCondition);
      }

      conditions.push(inArray(orders.orderStatus, statuses));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const resolvedPage = page ?? PAGINATION_DEFAULTS.PAGE;
      const resolvedLimit = Math.min(
        limit ?? PAGINATION_DEFAULTS.LIMIT,
        PAGINATION_DEFAULTS.MAX_LIMIT,
      );
      const offset = (resolvedPage - 1) * resolvedLimit;

      const ordersTotalList = await db
        .select({
          orderId: orders.id,
          referenceNumber: orders.referenceNumber,
          bakeryId: orders.bakeryId,
          addonsTotal: orders.addonsTotal,
          bastiPercentage: orders.bastiPercentage,
          deliveryAmount: orders.deliveryAmount,
          bastiDeliveryAmount: orders.bastiDeliveryAmount,
          totalPrice: orders.totalPrice,
          discountAmount: orders.discountAmount,
          finalPrice: orders.finalPrice,
          orderStatus: orders.orderStatus,
          deliveredAt: orders.deliveredAt,
          createdAt: orders.createdAt,
          bakeryName: this.translationService.getLocalized(bakeries.name, 'name'),
        })
        .from(orders)
        .leftJoin(bakeries, eq(orders.bakeryId, bakeries.id))
        .where(whereClause)
        .orderBy(desc(dateColumn));

      if (!ordersTotalList || ordersTotalList.length === 0) {
        this.logger.log('No orders matched the financials filters; returning empty result');
        return successResponse(
          {
            rows: [],
            total: {
              addonsTotal: 0,
              bastiTotal: 0,
              bakeryTotal: 0,
              deliveryAmount: 0,
              bastiDeliveryAmount: 0,
              totalPrice: 0,
              discountAmount: 0,
              finalPrice: 0,
            },
            pagination: {
              total: 0,
              limit: resolvedLimit,
              page: resolvedPage,
              totalPages: 0,
            },
          },
          'routes.orders.financials_retrieved',
        );
      }

      const ordersList = await db
        .select({
          orderId: orders.id,
          referenceNumber: orders.referenceNumber,
          bakeryId: orders.bakeryId,
          addonsTotal: orders.addonsTotal,
          bastiPercentage: orders.bastiPercentage,
          deliveryAmount: orders.deliveryAmount,
          bastiDeliveryAmount: orders.bastiDeliveryAmount,
          totalPrice: orders.totalPrice,
          discountAmount: orders.discountAmount,
          finalPrice: orders.finalPrice,
          orderStatus: orders.orderStatus,
          deliveredAt: orders.deliveredAt,
          createdAt: orders.createdAt,
          bakeryName: this.translationService.getLocalized(bakeries.name, 'name'),
        })
        .from(orders)
        .leftJoin(bakeries, eq(orders.bakeryId, bakeries.id))
        .where(whereClause)
        .orderBy(desc(dateColumn))
        .limit(resolvedLimit)
        .offset(offset);

      const rows = ordersList.map((order) => {
        const totalPrice = Number(order.totalPrice) || 0;
        const bastiPercentage = parseFloat(order.bastiPercentage) || 0;
        const bastiAmount = bastiPercentage * totalPrice;

        return {
          addonsTotal: Number(order.addonsTotal) || 0,
          bastiPercentage,
          bastiAmount,
          deliveryAmount: Number(order.deliveryAmount) || 0,
          bastiDeliveryAmount: Number(order.bastiDeliveryAmount) || 0,
          totalPrice,
          discountAmount: Number(order.discountAmount) || 0,
          finalPrice: Number(order.finalPrice) || 0,
          bakeryId: order.bakeryId || '',
          bakeryName: order.bakeryName || '',
          orderId: order.orderId,
          referenceNumber: order.referenceNumber || '',
          orderStatus: order.orderStatus,
          deliveredAt: order.deliveredAt,
          createdAt: order.createdAt,
        };
      });

      const total = ordersTotalList.reduce(
        (acc, order) => ({
          addonsTotal: acc.addonsTotal + (Number(order.addonsTotal) || 0),
          bastiTotal:
            acc.bastiTotal +
            (parseFloat(order.bastiPercentage) || 0) * (Number(order.totalPrice) || 0) +
            (Number(order.bastiDeliveryAmount) || 0),
          bakeryTotal: acc.bakeryTotal + (Number(order.finalPrice) || 0),
          deliveryAmount: acc.deliveryAmount + (Number(order.deliveryAmount) || 0),
          bastiDeliveryAmount: acc.bastiDeliveryAmount + (Number(order.bastiDeliveryAmount) || 0),
          totalPrice: acc.totalPrice + (Number(order.totalPrice) || 0),
          discountAmount: acc.discountAmount + (Number(order.discountAmount) || 0),
          finalPrice: acc.finalPrice + (Number(order.finalPrice) || 0),
        }),
        {
          addonsTotal: 0,
          bastiTotal: 0,
          bakeryTotal: 0,
          deliveryAmount: 0,
          bastiDeliveryAmount: 0,
          totalPrice: 0,
          discountAmount: 0,
          finalPrice: 0,
        },
      );

      const totalCount = ordersTotalList.length;
      const totalPages = Math.ceil(totalCount / resolvedLimit);

      return successResponse(
        {
          rows,
          total,
          pagination: {
            total: totalCount,
            limit: resolvedLimit,
            page: resolvedPage,
            totalPages,
          },
        },
        'routes.orders.financials_retrieved',
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to retrieve financials:`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_financials',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
