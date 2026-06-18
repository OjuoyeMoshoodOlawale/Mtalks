/**
 * Paystack Fee Calculator
 *
 * NGN (local Nigerian card):
 *   Fee = 1.5% + ₦100 flat (flat waived for amounts < ₦2,500)
 *   Cap = ₦2,000 maximum fee on any single transaction
 *
 * USD / international card:
 *   Fee = 3.9% + ₦100 flat (no cap)
 *
 * grossAmount = the amount to charge the customer so that after
 *               Paystack deducts its fee, you receive exactly `amount`.
 */

/**
 * Calculate Paystack fee for a given amount and currency.
 * @param {number} amount - The amount you want to receive (in NGN or USD)
 * @param {string} currency - 'NGN' or 'USD'
 * @returns {{ fee: number, total: number, breakdown: string }}
 */
const calculatePaystackFee = (amount, currency = 'NGN') => {
  let fee;

  if (currency === 'NGN') {
    const percentageFee = amount * 0.015;
    const flatFee       = amount < 2500 ? 0 : 100;
    fee = Math.min(percentageFee + flatFee, 2000); // capped at ₦2,000
  } else {
    // USD / international card: 3.9% + ₦100 equivalent
    // Paystack currently uses ~$0.50 flat for USD transactions
    fee = (amount * 0.039) + 0.50;
  }

  fee = Math.round(fee * 100) / 100; // 2 decimal places

  const symbol = currency === 'USD' ? '$' : '₦';
  const fmt    = n => `${symbol}${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return {
    fee,
    total:     Math.round((amount + fee) * 100) / 100,
    breakdown: `${fmt(amount)} + ${fmt(fee)} processing fee = ${fmt(amount + fee)}`,
  };
};

/**
 * Calculate the gross amount to send to Paystack so that after their
 * fee is deducted, you receive exactly `amount`.
 * @param {number} amount
 * @param {string} currency
 * @returns {number} grossAmount — what the customer is charged
 */
const calculateGrossAmount = (amount, currency = 'NGN') => {
  let gross;

  if (currency === 'NGN') {
    const flatFee = amount >= 2500 ? 100 : 0;
    gross = (amount + flatFee) / (1 - 0.015);
    // If gross fee would exceed ₦2,000 cap, just add the cap
    const fee = gross - amount;
    if (fee > 2000) gross = amount + 2000;
  } else {
    // USD: reverse of 3.9% + $0.50
    gross = (amount + 0.50) / (1 - 0.039);
  }

  return Math.ceil(gross * 100) / 100; // round up so merchant never under-collects
};

module.exports = { calculatePaystackFee, calculateGrossAmount };
