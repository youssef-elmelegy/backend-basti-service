import { orders } from '@/db/schema';

type PaymentData = (typeof orders.$inferSelect)['paymentData'];

/**
 * Resolves the payment gateway cut for an order.
 *
 * `paymentGatewayFee` is stored as a percentage (e.g. `1.5` for 1.5%). Cash and
 * wallet orders carry no gateway fields at all, so the rate is 0, the fee is 0
 * and the factor is 1 — amounts pass through untouched.
 *
 * The `factor` re-scales money columns that are stored *before* the gateway
 * deduction (`bakery_amount`, `basti_amount`, `addons_total`, delivery) into
 * what is actually paid out.
 */
export function processPaymentData(paymentData: PaymentData, finalPrice: number) {
  const name = paymentData?.paymentGatewayName || '';
  const rate = (paymentData?.paymentGatewayFee ?? 0) / 100;
  return {
    name,
    fee: finalPrice * rate,
    factor: 1 - rate, // factor to re-calculate the final share after deducting the gateway fee
  };
}

/**
 * The bakery's actual payout for an order, net of the gateway fee.
 *
 * `orders.bakery_amount` is stored gross, so reading the column directly
 * overstates what the bakery is paid. Every bakery-facing surface must go
 * through this.
 */
export function getBakeryNetAmount(
  bakeryAmount: string | null,
  paymentData: PaymentData,
  finalPrice: number,
): number {
  const { factor } = processPaymentData(paymentData, finalPrice);
  return (parseFloat(bakeryAmount ?? '0') || 0) * factor;
}
