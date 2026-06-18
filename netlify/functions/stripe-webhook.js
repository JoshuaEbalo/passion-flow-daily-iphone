const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  // ── 1. Verify Stripe signature ───────────────────────────────────────────
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // Do NOT echo err.message — it can contain raw header values.
    console.error('[stripe-webhook] Signature verification failed');
    return { statusCode: 400, body: 'Webhook signature invalid' };
  }

  // ── 2. Idempotency guard ─────────────────────────────────────────────────
  // Stripe retries on non-2xx responses. Store the event ID so we process
  // each event exactly once even if it is delivered multiple times.
  const eventRef = db.collection('processedEvents').doc(stripeEvent.id);
  const existing = await eventRef.get();
  if (existing.exists) {
    console.log('[stripe-webhook] Already processed event, skipping:', stripeEvent.id);
    return { statusCode: 200, body: 'ok (duplicate)' };
  }

  // Mark as processed before doing the work so a crash-and-retry from Stripe
  // doesn't double-process. Use a transaction if atomicity matters more than
  // simplicity — for subscription state it's fine to mark first.
  await eventRef.set({ processedAt: admin.firestore.FieldValue.serverTimestamp(), type: stripeEvent.type });

  const data = stripeEvent.data.object;

  try {
    switch (stripeEvent.type) {

      // User completed checkout (trial started or paid)
      case 'checkout.session.completed': {
        const uid = data.client_reference_id;
        if (uid) {
          await db.collection('users').doc(uid).set({
            isPro: true,
            stripeCustomerId: data.customer,
            subscriptionStatus: 'active',
          }, { merge: true });
          console.log('[stripe-webhook] checkout.session.completed — activated user');
        }
        break;
      }

      // Subscription renewed successfully
      case 'invoice.payment_succeeded': {
        const customerId = data.customer;
        if (customerId) {
          const snap = await db.collection('users')
            .where('stripeCustomerId', '==', customerId).get();
          for (const doc of snap.docs) {
            await doc.ref.set({ isPro: true, subscriptionStatus: 'active' }, { merge: true });
          }
        }
        break;
      }

      // Payment failed — revoke access
      case 'invoice.payment_failed': {
        const customerId = data.customer;
        if (customerId) {
          const snap = await db.collection('users')
            .where('stripeCustomerId', '==', customerId).get();
          for (const doc of snap.docs) {
            await doc.ref.set({ isPro: false, subscriptionStatus: 'past_due' }, { merge: true });
          }
        }
        break;
      }

      // Subscription cancelled or expired
      case 'customer.subscription.deleted': {
        const customerId = data.customer;
        if (customerId) {
          const snap = await db.collection('users')
            .where('stripeCustomerId', '==', customerId).get();
          for (const doc of snap.docs) {
            await doc.ref.set({ isPro: false, subscriptionStatus: 'cancelled' }, { merge: true });
          }
        }
        break;
      }

      // Subscription status changed (trial→active, active→past_due, etc.)
      case 'customer.subscription.updated': {
        const customerId = data.customer;
        const status = data.status;
        if (customerId) {
          const isPro = status === 'active' || status === 'trialing';
          const snap = await db.collection('users')
            .where('stripeCustomerId', '==', customerId).get();
          for (const doc of snap.docs) {
            await doc.ref.set({ isPro, subscriptionStatus: status }, { merge: true });
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('[stripe-webhook] Firestore update error:', err.message);
    return { statusCode: 500, body: 'Internal error' };
  }

  return { statusCode: 200, body: 'ok' };
};
