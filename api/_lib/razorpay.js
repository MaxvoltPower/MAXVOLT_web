import Razorpay from 'razorpay';
import crypto from 'crypto';

let client = null;

export function getRazorpay() {
  if (client) return client;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials missing');
  }

  client = new Razorpay({ key_id, key_secret });
  return client;
}

/**
 * Verify a Razorpay webhook signature using a constant-time comparison.
 * @param {Buffer|string} rawBody  Raw request body
 * @param {string}        signature Header 'x-razorpay-signature'
 * @param {string}        secret    Webhook secret
 * @returns {boolean}
 */
export function verifyWebhookSignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  try {
    return (
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    );
  } catch {
    return false;
  }
}