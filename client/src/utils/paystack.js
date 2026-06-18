/**
 * Paystack fee utilities — NGN and USD
 *
 * NGN (local Nigerian card):
 *   Fee = 1.5% + ₦100 flat (flat waived for amounts ≤ ₦2,500)
 *   Cap = ₦2,000 maximum fee
 *
 * USD / international card:
 *   Fee = 3.9% + $0.50 flat (no cap)
 *
 * grossUp = the amount to charge the customer so that after Paystack
 * deducts its fee, the merchant receives exactly the listed price.
 */

/**
 * Gross-up the listed price for the customer to pay.
 * @param {number} desiredNet  - Amount merchant wants to receive
 * @param {string} currency    - 'NGN' | 'USD'
 * @returns {number}           - Amount to charge the customer
 */
export function paystackGrossUp(desiredNet, currency = 'NGN') {
  const net = Number(desiredNet)

  if (currency === 'USD') {
    // USD: 3.9% + $0.50 flat, no cap
    const charge = (net + 0.50) / (1 - 0.039)
    return Math.ceil(charge * 100) / 100 // round up to 2dp
  }

  // NGN local card
  const flat   = net > 2500 ? 100 : 0
  let charge   = (net + flat) / 0.985

  // If fee would exceed ₦2,000 cap, use flat cap instead
  if (charge * 0.015 + flat >= 2000) {
    charge = net + 2000
  }

  return Math.ceil(charge) // round up — merchant never short-changed
}

/**
 * Returns fee amount and full breakdown string for display.
 * @param {number} desiredNet
 * @param {string} currency
 * @returns {{ charge: number, fee: number, symbol: string, breakdown: string }}
 */
export function paystackFeeBreakdown(desiredNet, currency = 'NGN') {
  const net    = Number(desiredNet)
  const charge = paystackGrossUp(net, currency)
  const fee    = Math.round((charge - net) * 100) / 100
  const symbol = currency === 'USD' ? '$' : '₦'
  const fmt    = n => `${symbol}${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return {
    charge,
    fee,
    symbol,
    breakdown: `${fmt(net)} + ${fmt(fee)} Paystack fee = ${fmt(charge)}`,
  }
}

/**
 * Format an amount with the correct currency symbol.
 */
export function formatAmount(amount, currency = 'NGN') {
  const symbol = currency === 'USD' ? '$' : '₦'
  return `${symbol}${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
