/**
 * RevenueCat Webhook Handler
 *
 * RevenueCat does NOT sign its payloads with a cryptographic signature.
 * The only authentication mechanism is comparing the incoming Authorization
 * header against a shared secret using a constant-time comparison to prevent
 * timing attacks.
 *
 * Register this URL in RevenueCat Dashboard → Project → Integrations → Webhooks:
 *   https://<your-netlify-site>.netlify.app/.netlify/functions/revenuecat-webhook
 *
 * Set the Authorization header secret in RevenueCat to match
 * REVENUECAT_WEBHOOK_SECRET in your Netlify environment variables.
 *
 * Docs: https://www.revenuecat.com/docs/integrations/webhooks
 */

const admin = require('firebase-admin');
const crypto = require('crypto');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

const db = admin.firestore();

// Constant-time string comparison to prevent timing attacks.
// A regular === comparison can leak how many characters matched
// based on how fast it returns, letting an attacker brute-force the secret.
function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    // Still run timingSafeEqual on equal-length buffers to avoid short-circuit,
    // but return false after.
    crypto.timingSafeEqual(Buffer.alloc(aBuf.length), Buffer.alloc(aBuf.length));
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// Maps RevenueCat event types to isPro boolean
function eventToProStatus(eventType) {
  const activeTypes = new Set([
    'INITIAL_PURCHASE',
    'RENEWAL',
    'PRODUCT_CHANGE',
    'TRIAL_STARTED',
    'TRIAL_CONVERTED',
    'UNCANCELLATION',
  ]);
  const inactiveTypes = new Set([
    'CANCELLATION',
    'EXPIRATION',
    'BILLING_ISSUE',
    'SUBSCRIBER_ALIAS',
  ]);
  if (activeTypes.has(eventType)) return true;
  if (inactiveTypes.has(eventType)) return false;
  return null; // Unknown event type — don't change isPro
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // ── 1. Authenticate via Authorization header (constant-time) ─────────────
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[revenuecat-webhook] REVENUECAT_WEBHOOK_SECRET env var is not set');
    return { statusCode: 500, body: 'Server configuration error' };
  }

  const incoming = event.headers['authorization'] || '';
  if (!constantTimeEqual(incoming, secret)) {
    console.error('[revenuecat-webhook] Authorization header mismatch');
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const rcEvent = payload.event;
  if (!rcEvent || !rcEvent.type || !rcEvent.app_user_id) {
    return { statusCode: 400, body: 'Missing event.type or event.app_user_id' };
  }

  const eventType = rcEvent.type;
  const uid = rcEvent.app_user_id; // Set to Firebase UID via Purchases.configure({appUserID: uid})
  // Use transaction_id if present, fall back to id for idempotency key
  const idempotencyKey = rcEvent.id || rcEvent.transaction_id || `${uid}-${eventType}-${rcEvent.purchased_at_ms}`;

  // ── 3. Idempotency guard ──────────────────────────────────────────────────
  const eventRef = db.collection('processedRCEvents').doc(String(idempotencyKey));
  const existing = await eventRef.get();
  if (existing.exists) {
    console.log('[revenuecat-webhook] Already processed RC event, skipping:', idempotencyKey);
    return { statusCode: 200, body: 'ok (duplicate)' };
  }

  await eventRef.set({
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    type: eventType,
    uid,
  });

  // ── 4. Update Firestore ───────────────────────────────────────────────────
  const isPro = eventToProStatus(eventType);
  if (isPro === null) {
    console.log('[revenuecat-webhook] Unhandled event type, no isPro change:', eventType);
    return { statusCode: 200, body: 'ok (no-op)' };
  }

  try {
    await db.collection('users').doc(uid).set(
      {
        isPro,
        subscriptionStatus: isPro ? 'active' : 'cancelled',
        ...(rcEvent.expiration_at_ms && { rcExpiresAt: rcEvent.expiration_at_ms }),
      },
      { merge: true }
    );
    console.log(`[revenuecat-webhook] ${eventType} — set isPro=${isPro} for user`);
  } catch (err) {
    console.error('[revenuecat-webhook] Firestore update error:', err.message);
    return { statusCode: 500, body: 'Internal error' };
  }

  return { statusCode: 200, body: 'ok' };
};
