const crypto = require('crypto');
const fetch  = require('node-fetch');

const BASE = 'https://api.paystack.co';

/**
 * Paystack keys — hardcoded as constants while .env loading is being fixed.
 * Swap to process.env.X once .env is confirmed:
 *   const PAYSTACK_SECRET_KEY  = process.env.PAYSTACK_SECRET_KEY;
 *   const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
 *
 * Get your keys from: https://dashboard.paystack.com/#/settings/developer
 * Use sk_test_... for test mode, sk_live_... for production.
 */
/**
 * Paystack secret key — reads from process.env.PAYSTACK_SECRET_KEY in server/.env
 * Same key is used for API calls AND webhook signature verification.
 * No separate webhook secret (Paystack signs with the same key).
 * Get from: dashboard.paystack.com → Settings → API Keys & Webhooks
 */
const SK     = () => process.env.PAYSTACK_SECRET_KEY || '';
const WH_SEC = () => process.env.PAYSTACK_SECRET_KEY || '';

const headers = () => ({
  Authorization:  `Bearer ${SK()}`,
  'Content-Type': 'application/json'
});

/** Initialize a Paystack transaction */
const initializeTransaction = async ({ email, amount, reference, metadata = {}, callback_url }) => {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method:  'POST',
    headers: headers(),
    body: JSON.stringify({
      email,
      amount:       Math.round(amount * 100), // kobo
      reference,
      metadata,
      callback_url: callback_url || process.env.CLIENT_URL + '/payment/verify'
    })
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message || 'Failed to initialize transaction');
  return data.data;
};

/** Verify a Paystack transaction */
const verifyTransaction = async (reference) => {
  const res  = await fetch(`${BASE}/transaction/verify/${reference}`, { headers: headers() });
  const data = await res.json();
  if (!data.status) throw new Error(data.message || 'Failed to verify transaction');
  return data.data;
};

/** Verify webhook signature from Paystack */
const verifyWebhookSignature = (rawBody, signature) => {
  const hash = crypto
    .createHmac('sha512', WH_SEC())
    .update(rawBody)
    .digest('hex');
  return hash === signature;
};

module.exports = { initializeTransaction, verifyTransaction, verifyWebhookSignature };
