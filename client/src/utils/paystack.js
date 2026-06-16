/**
 * Gross-up the listed price so that after Paystack deducts its fee,
 * the merchant receives exactly the original listed price.
 *
 * Paystack Nigeria local card rates (June 2026):
 *   Fee = 1.5% + ₦100  (₦100 waived for amounts ≤ ₦2,500)
 *   Cap = ₦2,000 maximum fee
 *
 * @param {number} desiredNet - Amount you want to RECEIVE (Naira)
 * @returns {number}           - Amount to CHARGE the customer (Naira, rounded up)
 */
export function paystackGrossUp(desiredNet) {
  const net  = Number(desiredNet)
  const flat = net > 2500 ? 100 : 0
  let charge = (net + flat) / 0.985

  // If fee would exceed the ₦2,000 cap, use flat cap
  if (charge * 0.015 + flat >= 2000) {
    charge = net + 2000
  }

  return Math.ceil(charge)  // always round UP — merchant never short-changed
}

/** Returns the gross charge + breakdown for display */
export function paystackFeeBreakdown(desiredNet) {
  const charge = paystackGrossUp(desiredNet)
  const fee    = charge - Number(desiredNet)
  return { charge, fee }
}
