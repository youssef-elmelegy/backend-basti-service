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

  /**
   * Gateway fee rate charged on the amount paid through the online payment gateway.
   * Deducted from Basti's share. Cash/wallet or unknown gateways incur no fee.
   */
  private static readonly GATEWAY_FEE_RATES: Record<string, number> = {
    masarat: 0.01, // 1%
    tadawul: 0.015, // 1.5%
  };

  private gatewayFee(
    paymentData: { paymentGatewayName?: string } | null,
    finalPrice: number,
  ): { gatewayName: string; gatewayFee: number } {
    const gatewayName = paymentData?.paymentGatewayName || '';
    const rate = FinancialsService.GATEWAY_FEE_RATES[gatewayName] ?? 0;
    return { gatewayName, gatewayFee: finalPrice * rate };
  }

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

      const resolvedPage = page ?? PAGINATION_DEFAULTS.PAGE;
      const resolvedLimit = Math.min(
        limit ?? PAGINATION_DEFAULTS.LIMIT,
        PAGINATION_DEFAULTS.MAX_LIMIT,
      );
      const offset = (resolvedPage - 1) * resolvedLimit;

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
              bastiNetTotal: 0,
              miniCakesTotal: 0,
              miniCakePercentage: 0,
              bastiPercentage: 0,
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
        .limit(resolvedLimit)
        .offset(offset);

      const rows = ordersList.map((order) => {
        const bastiAmount = parseFloat(order.bastiAmount) || 0;
        const finalPrice = parseFloat(order.finalPrice) || 0;
        const { gatewayName, gatewayFee } = this.gatewayFee(order.paymentData, finalPrice);
        return {
          addonsTotal: order.addonsTotal,
          bastiPercentage: parseFloat(order.bastiPercentage) || 0,
          bastiAmount,
          bakeryAmount: parseFloat(order.bakeryAmount) || 0,
          deliveryAmount: order.deliveryAmount, // total delivery price
          bastiDeliveryAmount: order.bastiDeliveryAmount, // basti delivery price share
          gatewayName, // 'masarat' | 'tadawul' | '' (cash/wallet/unknown)
          gatewayFee, // finalPrice * rate; deducted from Basti's share
          bastiNet: bastiAmount - gatewayFee, // Basti amount after gateway fee
          totalPrice: parseFloat(order.totalPrice) || 0,
          finalPrice,
          discountAmount: parseFloat(order.discountAmount) || 0,
          bakeryId: order.bakeryId || '',
          bakeryName: order.bakeryName || '',
          orderId: order.orderId,
          referenceNumber: order.referenceNumber || '',
          orderStatus: order.orderStatus,
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
          const { gatewayFee } = this.gatewayFee(order.paymentData, finalPrice);
          return {
            addonsTotal: acc.addonsTotal + order.addonsTotal,
            bastiTotal: acc.bastiTotal + bastiAmount,
            bakeryTotal: acc.bakeryTotal + (parseFloat(order.bakeryAmount) || 0),
            deliveryAmount: acc.deliveryAmount + order.deliveryAmount,
            bastiDeliveryAmount: acc.bastiDeliveryAmount + order.bastiDeliveryAmount,
            gatewayFeeTotal: acc.gatewayFeeTotal + gatewayFee,
            bastiNetTotal: acc.bastiNetTotal + (bastiAmount - gatewayFee),
            totalPrice: acc.totalPrice + (parseFloat(order.totalPrice) || 0),
            discountAmount: acc.discountAmount + (parseFloat(order.discountAmount) || 0),
            finalPrice: acc.finalPrice + finalPrice,
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
          bastiNetTotal: 0,
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
      handleErrorsAndThrow(error, 'routes.orders.failed_financials', this.logger);
    }
  }
}
