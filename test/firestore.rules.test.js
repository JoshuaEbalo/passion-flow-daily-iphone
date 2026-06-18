/**
 * Firestore Security Rules Unit Tests
 *
 * Install deps (run once):
 *   npm install --save-dev @firebase/rules-unit-testing jest
 *
 * Run tests:
 *   npx jest test/firestore.rules.test.js
 *
 * Requires the Firebase Emulator Suite:
 *   npm install -g firebase-tools
 *   firebase emulators:start --only firestore
 */

const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { readFileSync } = require('fs');
const path = require('path');

const PROJECT_ID = 'passion-flow-daily-test';
const RULES_PATH = path.resolve(__dirname, '../firestore.rules');

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

// ── Helper factories ─────────────────────────────────────────────────────────

function ownerDb(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

function otherUserDb(otherUid) {
  return testEnv.authenticatedContext(otherUid).firestore();
}

function unauthDb() {
  return testEnv.unauthenticatedContext().firestore();
}

async function seedUserDoc(uid, data = {}) {
  // Use admin context to bypass rules for seeding
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('users').doc(uid).set({
      userName: 'Test User',
      isPro: false,
      subscriptionStatus: 'none',
      ...data,
    });
  });
}

// ── tests: unauthenticated ────────────────────────────────────────────────────

describe('unauthenticated', () => {
  test('cannot read any user doc', async () => {
    await seedUserDoc('user-a');
    await assertFails(unauthDb().collection('users').doc('user-a').get());
  });

  test('cannot create a user doc', async () => {
    await assertFails(
      unauthDb().collection('users').doc('user-a').set({ userName: 'hacker' })
    );
  });
});

// ── tests: owner access ───────────────────────────────────────────────────────

describe('owner', () => {
  const UID = 'owner-uid';

  test('can read their own doc', async () => {
    await seedUserDoc(UID);
    await assertSucceeds(ownerDb(UID).collection('users').doc(UID).get());
  });

  test('can create their own doc without entitlement fields', async () => {
    await assertSucceeds(
      ownerDb(UID).collection('users').doc(UID).set({
        userName: 'Josh',
        createdAt: Date.now(),
        email: 'josh@example.com',
      })
    );
  });

  test('can update allowed fields (userName, logsData, etc.)', async () => {
    await seedUserDoc(UID);
    await assertSucceeds(
      ownerDb(UID).collection('users').doc(UID).set(
        { userName: 'Updated Name', reminderTime: '9:00 AM' },
        { merge: true }
      )
    );
  });

  test('can delete their own doc', async () => {
    await seedUserDoc(UID);
    await assertSucceeds(ownerDb(UID).collection('users').doc(UID).delete());
  });
});

// ── tests: isPro is client-write-protected ────────────────────────────────────

describe('isPro protection', () => {
  const UID = 'pro-test-uid';

  test('client CANNOT set isPro=true on create', async () => {
    await assertFails(
      ownerDb(UID).collection('users').doc(UID).set({
        userName: 'Hacker',
        isPro: true,
      })
    );
  });

  test('client CANNOT update isPro to true', async () => {
    await seedUserDoc(UID, { isPro: false });
    await assertFails(
      ownerDb(UID).collection('users').doc(UID).set(
        { isPro: true },
        { merge: true }
      )
    );
  });

  test('client CANNOT update subscriptionStatus', async () => {
    await seedUserDoc(UID);
    await assertFails(
      ownerDb(UID).collection('users').doc(UID).set(
        { subscriptionStatus: 'active' },
        { merge: true }
      )
    );
  });

  test('client CANNOT update stripeCustomerId', async () => {
    await seedUserDoc(UID);
    await assertFails(
      ownerDb(UID).collection('users').doc(UID).set(
        { stripeCustomerId: 'cus_fake' },
        { merge: true }
      )
    );
  });

  test('client CANNOT set isPro=false (still an entitlement write)', async () => {
    await seedUserDoc(UID, { isPro: true });
    await assertFails(
      ownerDb(UID).collection('users').doc(UID).set(
        { isPro: false },
        { merge: true }
      )
    );
  });
});

// ── tests: non-owner (cross-user) ─────────────────────────────────────────────

describe('non-owner', () => {
  const OWNER_UID = 'owner-uid';
  const OTHER_UID = 'other-uid';

  test('cannot read another user doc', async () => {
    await seedUserDoc(OWNER_UID);
    await assertFails(otherUserDb(OTHER_UID).collection('users').doc(OWNER_UID).get());
  });

  test('cannot write to another user doc', async () => {
    await seedUserDoc(OWNER_UID);
    await assertFails(
      otherUserDb(OTHER_UID).collection('users').doc(OWNER_UID).set(
        { userName: 'injected' },
        { merge: true }
      )
    );
  });

  test('cannot delete another user doc', async () => {
    await seedUserDoc(OWNER_UID);
    await assertFails(otherUserDb(OTHER_UID).collection('users').doc(OWNER_UID).delete());
  });
});

// ── tests: processedEvents (server-only) ─────────────────────────────────────

describe('processedEvents', () => {
  const UID = 'any-uid';

  test('client cannot read processedEvents', async () => {
    await assertFails(ownerDb(UID).collection('processedEvents').doc('evt_123').get());
  });

  test('client cannot write processedEvents', async () => {
    await assertFails(
      ownerDb(UID).collection('processedEvents').doc('evt_123').set({ type: 'fake' })
    );
  });

  test('unauthenticated cannot read processedEvents', async () => {
    await assertFails(unauthDb().collection('processedEvents').doc('evt_123').get());
  });
});
