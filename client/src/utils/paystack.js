/**
 * Paystack fee utilities — NGN and USD
 *
 * NGN (local Nigerian card):
 * Fee = 1.5% + ₦100 flat (flat waived for amounts <= ₦2,500)
 * Cap = ₦2,000 maximum fee
 *
 * USD / international card:
 * Fee = 3.9% + $0.50 flat (no cap)
 *
 * grossUp = the amount to charge the customer so that after Paystack
 * deducts its fee, the merchant receives exactly the listed price.
 */

/**
 * Gross-up the listed price for the customer to pay (in standard units like Naira or Dollars).
 * @param {number} desiredNet  - Amount merchant wants to receive (e.g. 50000)
 * @param {string} currency    - 'NGN' | 'USD'
 * @returns {number}           - Amount to charge the customer
 */
export function paystackGrossUp(desiredNet, currency = "NGN") {
  const net = Number(desiredNet);

  if (currency === "USD") {
    // USD: 3.9% + $0.50 flat, no cap
    const charge = (net + 0.5) / (1 - 0.039);
    // Rounding up to 2 decimal places max for USD base amount
    return Math.ceil(charge * 100) / 100;
  }

  // NGN local card
  const flat = net > 2500 ? 100 : 0;
  let charge = (net + flat) / 0.985;

  // If fee would exceed ₦2,000 cap, use flat cap instead
  if (charge * 0.015 + flat >= 2000) {
    charge = net + 2000;
  }

  return Math.ceil(charge); // round up to whole Naira
}

/**
 * Convert standard amount into Paystack-ready integer (Kobo or Cents).
 * Use this directly when passing 'amount' to PaystackPop.setup()!
 * @param {number} standardAmount - The customer-facing amount (e.g., 41624.87)
 * @returns {number}              - Safe integer for Paystack api (e.g., 4162487)
 */
export function toPaystackInteger(standardAmount) {
  return Math.round(Number(standardAmount) * 100);
}

/**
 * Returns fee amount and full breakdown string for display.
 * @param {number} desiredNet
 * @param {string} currency
 * @returns {{ charge: number, fee: number, paystackAmount: number, symbol: string, breakdown: string }}
 */
export function paystackFeeBreakdown(desiredNet, currency = "NGN") {
  const net = Number(desiredNet);
  const charge = paystackGrossUp(net, currency);
  const fee = Math.round((charge - net) * 100) / 100;
  const paystackAmount = toPaystackInteger(charge);
  const symbol = currency === "USD" ? "$" : "₦";

  const fmt = (n) =>
    `${symbol}${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return {
    charge,
    fee,
    paystackAmount, // <-- Pass this integer to your Paystack setup payload!
    symbol,
    breakdown: `${fmt(net)} + ${fmt(fee)} Paystack fee = ${fmt(charge)}`,
  };
}

/**
 * Format an amount with the correct currency symbol.
 */
export function formatAmount(amount, currency = "NGN") {
  const symbol = currency === "USD" ? "$" : "₦";
  return `${symbol}${Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
