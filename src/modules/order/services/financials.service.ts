import { Injectable, HttpStatus, Logger, NotFoundException } from '@nestjs/common';
import { GetOrdersFinancialsDto, GetOrdersFinancialsResponseDto } from '../dto';
import { db } from '@/db';
import { orders, bakeries } from '@/db/schema';
import { and, eq, gte, inArray, lte, SQL, desc, isNotNull } from 'drizzle-orm';
import { PAGINATION_DEFAULTS } from '@/constants/global.constants';
import { errorResponse, successResponse, SuccessResponse, handleErrorsAndThrow } from '@/utils';
import { TranslationService } from '@/common';

@Injectable()
export class FinancialsService {
  private readonly logger = new Logger(FinancialsService.name);

  constructor(private readonly translationService: TranslationService) {}

  private processPaymentData(
    paymentData: (typeof orders.$inferSelect)['paymentData'],
    finalPrice: number,
  ) {
    const name = paymentData?.paymentGatewayName || '';
    let rate = paymentData?.paymentGatewayFee ?? 0;
    rate /= 100;
    return {
      name,
      fee: finalPrice * rate,
      factor: 1 - rate, // factor to re-calculate the final share after deducting the gateway fee
    };
  }

  async getOrdersFinancials(
    dto: GetOrdersFinancialsDto,
  ): Promise<SuccessResponse<GetOrdersFinancialsResponseDto>> {
    const { bakeryId, from, to, page, limit, all } = dto;
    return this.computeFinancials({
      bakeryId,
      from,
      to,
      page,
      limit,
      all,
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
    all?: boolean;
    statuses: (typeof orders.orderStatus.enumValues)[number][];
    dateField: 'deliveredAt' | 'createdAt';
  }): Promise<SuccessResponse<GetOrdersFinancialsResponseDto>> {
    const { bakeryId, from, to, page, limit, all, statuses, dateField } = opts;
    const dateColumn = dateField === 'createdAt' ? orders.createdAt : orders.deliveredAt;

    try {
      const conditions: SQL[] = [];

      if (bakeryId) {
        const [bakery] = await db.select().from(bakeries).where(eq(bakeries.id, bakeryId)).limit(1);

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

      // `all` (used by the PDF export) returns every matching row. The MAX_LIMIT
      // clamp only guards the paginated screen path — capping the export would
      // silently drop orders from the report.
      const resolvedPage = all ? 1 : (page ?? PAGINATION_DEFAULTS.PAGE);
      const resolvedLimit = all
        ? null
        : Math.min(limit ?? PAGINATION_DEFAULTS.LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);
      const offset = resolvedLimit === null ? 0 : (resolvedPage - 1) * resolvedLimit;

      const ordersTotalList = await db
        .select({
          orderId: orders.id,
          addonsTotal: orders.addonsTotal,
          bastiPercentage: orders.bastiPercentage,
          bastiAmount: orders.bastiAmount,
          bakeryAmount: orders.bakeryAmount,
          deliveryAmount: orders.deliveryAmount,
          bastiDeliveryAmount: orders.bastiDeliveryAmount,
          paymentData: orders.paymentData,
          referenceNumber: orders.referenceNumber,
          bakeryId: orders.bakeryId,
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
              gatewayFeeTotal: 0,
              miniCakesTotal: 0,
              finalPriceBeforeGatewayFee: 0,
              miniCakePercentage: 0,
              bastiPercentage: 0,
              totalPrice: 0,
              discountAmount: 0,
              finalPrice: 0,
            },
            pagination: {
              total: 0,
              limit: resolvedLimit ?? 0,
              page: resolvedPage,
              totalPages: 0,
            },
          },
          'routes.orders.financials_retrieved',
        );
      }

      const ordersQuery = db
        .select({
          orderId: orders.id,
          referenceNumber: orders.referenceNumber,
          bakeryId: orders.bakeryId,
          addonsTotal: orders.addonsTotal,
          bastiPercentage: orders.bastiPercentage,
          bastiAmount: orders.bastiAmount,
          bakeryAmount: orders.bakeryAmount,
          deliveryAmount: orders.deliveryAmount,
          bastiDeliveryAmount: orders.bastiDeliveryAmount,
          paymentData: orders.paymentData,
          totalPrice: orders.totalPrice,
          discountAmount: orders.discountAmount,
          finalPrice: orders.finalPrice,
          orderStatus: orders.orderStatus,
          cartType: orders.cartType,
          deliveredAt: orders.deliveredAt,
          createdAt: orders.createdAt,
          bakeryName: this.translationService.getLocalized(bakeries.name, 'name'),
        })
        .from(orders)
        .leftJoin(bakeries, eq(orders.bakeryId, bakeries.id))
        .where(whereClause)
        .orderBy(desc(dateColumn))
        .$dynamic();

      const ordersList = await (resolvedLimit === null
        ? ordersQuery
        : ordersQuery.limit(resolvedLimit).offset(offset));

      const rows = ordersList.map((order) => {
        const bastiAmount = parseFloat(order.bastiAmount) || 0;
        const finalPrice = parseFloat(order.finalPrice) || 0;
        const {
          name: gatewayName,
          fee: gatewayFee,
          factor,
        } = this.processPaymentData(order.paymentData, finalPrice);
        return {
          addonsTotal: order.addonsTotal * factor,
          bastiPercentage: parseFloat(order.bastiPercentage) || 0,
          bastiAmount: bastiAmount * factor,
          bakeryAmount: (parseFloat(order.bakeryAmount) || 0) * factor,
          deliveryAmount: order.deliveryAmount * factor, // total delivery price
          bastiDeliveryAmount: order.bastiDeliveryAmount * factor, // basti delivery price share
          gatewayName, // 'masarat' | 'tadawul' | '' (cash/wallet/unknown)
          gatewayFee, // finalPrice * rate; deducted from Basti's share
          totalPrice: parseFloat(order.totalPrice) || 0,
          discountAmount: parseFloat(order.discountAmount) || 0,
          finalPriceBeforeGatewayFee: finalPrice,
          finalPrice: finalPrice * factor,
          bakeryId: order.bakeryId || '',
          bakeryName: order.bakeryName || '',
          orderId: order.orderId,
          referenceNumber: order.referenceNumber || '',
          orderStatus: order.orderStatus,
          cartType: order.cartType,
          deliveredAt: order.deliveredAt,
          createdAt: order.createdAt,
          miniCakesTotal: 0, // TODO: remove
          miniCakePercentage: 0, // TODO: remove
        };
      });

      const total = ordersTotalList.reduce(
        (acc, order) => {
          const bastiAmount = parseFloat(order.bastiAmount) || 0;
          const finalPrice = parseFloat(order.finalPrice) || 0;
          const { fee: gatewayFee, factor } = this.processPaymentData(
            order.paymentData,
            finalPrice,
          );
          return {
            addonsTotal: acc.addonsTotal + order.addonsTotal * factor,
            bastiTotal: acc.bastiTotal + bastiAmount * factor,
            bakeryTotal: acc.bakeryTotal + (parseFloat(order.bakeryAmount) || 0) * factor,
            deliveryAmount: acc.deliveryAmount + order.deliveryAmount * factor,
            bastiDeliveryAmount: acc.bastiDeliveryAmount + order.bastiDeliveryAmount * factor,
            gatewayFeeTotal: acc.gatewayFeeTotal + gatewayFee,
            finalPriceBeforeGatewayFee: acc.finalPriceBeforeGatewayFee + finalPrice,
            totalPrice: acc.totalPrice + (parseFloat(order.totalPrice) || 0),
            discountAmount: acc.discountAmount + (parseFloat(order.discountAmount) || 0),
            finalPrice: acc.finalPrice + finalPrice * factor,
            miniCakesTotal: 0, // TODO: remove
            miniCakePercentage: 0, // TODO: remove
          };
        },
        {
          addonsTotal: 0,
          miniCakesTotal: 0,
          bastiTotal: 0,
          bakeryTotal: 0,
          deliveryAmount: 0,
          bastiDeliveryAmount: 0,
          gatewayFeeTotal: 0,
          finalPriceBeforeGatewayFee: 0,
          totalPrice: 0,
          discountAmount: 0,
          finalPrice: 0,
        },
      );

      const totalCount = ordersTotalList.length;
      // With `all`, everything came back in one response — a single page.
      const totalPages = resolvedLimit === null ? 1 : Math.ceil(totalCount / resolvedLimit);

      return successResponse(
        {
          rows,
          total,
          pagination: {
            total: totalCount,
            limit: resolvedLimit ?? totalCount,
            page: resolvedPage,
            totalPages,
          },
        },
        'routes.orders.financials_retrieved',
      );
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.orders.failed_financials', this.logger);
    }
  }
}
