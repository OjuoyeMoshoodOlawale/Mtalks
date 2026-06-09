const crypto = require('crypto');
const fetch  = require('node-fetch');

const BASE = 'https://api.paystack.co';
const SK   = () => process.env.PAYSTACK_SECRET_KEY;

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
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
};

module.exports = { initializeTransaction, verifyTransaction, verifyWebhookSignature };
