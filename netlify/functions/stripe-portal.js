/**
 * Stripe Billing Portal
 *
 * Authenticated endpoint — caller must provide a valid Firebase ID token
 * in the Authorization header: "Bearer <id-token>"
 *
 * Rate limited per UID (5 requests / 60 s) via Upstash Redis.
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Netlify env vars.
 * Without those vars the rate limiter is disabled (a warning is logged).
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

// ── Rate limiter (Upstash Redis sliding window) ───────────────────────────────
const RATE_LIMIT_ENABLED = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

const RATE_LIMIT_MAX = 5;       // requests
const RATE_LIMIT_WINDOW = 60;   // seconds

if (!RATE_LIMIT_ENABLED) {
  console.warn(
    '[stripe-portal] Rate limiting is DISABLED. ' +
    'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable it.'
  );
}

async function checkRateLimit(key) {
  if (!RATE_LIMIT_ENABLED) return { allowed: true };

  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW * 1000;
  const redisKey = `rl:portal:${key}`;

  // Sliding window via Redis sorted set:
  //   ZADD  — add current timestamp as both score and member
  //   ZREMRANGEBYSCORE — remove entries older than the window
  //   ZCARD — count entries in the window
  //   EXPIRE — auto-clean the key
  const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['ZADD', redisKey, now, String(now)],
      ['ZREMRANGEBYSCORE', redisKey, 0, now - windowMs],
      ['ZCARD', redisKey],
      ['EXPIRE', redisKey, RATE_LIMIT_WINDOW],
    ]),
  });

  if (!res.ok) {
    // Redis unavailable — fail open (log and allow) rather than lock out users
    console.error('[stripe-portal] Redis pipeline failed:', res.status);
    return { allowed: true };
  }

  const results = await res.json();
  const count = results[2].result;
  return {
    allowed: count <= RATE_LIMIT_MAX,
    retryAfter: count > RATE_LIMIT_MAX ? RATE_LIMIT_WINDOW : null,
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  // ── 1. Verify Firebase ID token ───────────────────────────────────────────
  const authHeader = event.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return { statusCode: 401, body: 'Missing Authorization header' };
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(token);
  } catch {
    return { statusCode: 401, body: 'Invalid or expired token' };
  }

  const uid = decodedToken.uid;
  const email = decodedToken.email;

  if (!email) {
    return { statusCode: 400, body: 'Account has no email address' };
  }

  // ── 2. Rate limit ─────────────────────────────────────────────────────────
  const { allowed, retryAfter } = await checkRateLimit(uid);
  if (!allowed) {
    return {
      statusCode: 429,
      headers: { 'Retry-After': String(retryAfter) },
      body: 'Too many requests',
    };
  }

  // ── 3. Create Stripe billing portal session ───────────────────────────────
  try {
    // Use verified email from the ID token — never trust a client-supplied value
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) {
      return {
        statusCode: 302,
        headers: { Location: '/?portal_error=no_customer' },
        body: '',
      };
    }

    const customerId = customers.data[0].id;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://passionflowdaily.com',
    });

    return {
      statusCode: 302,
      headers: { Location: session.url },
      body: '',
    };
  } catch (err) {
    // Don't echo err.message — it may contain customer IDs or internal details
    console.error('[stripe-portal] Error:', err.message);
    return { statusCode: 500, body: 'Error creating portal session' };
  }
};
