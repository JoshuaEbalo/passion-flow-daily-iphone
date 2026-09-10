/**
 * Look up Firebase Auth sign-in providers for an email.
 * Used when client-side fetchSignInMethodsForEmail returns empty (email enumeration protection).
 */

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let email = '';
  try {
    const body = JSON.parse(event.body || '{}');
    email = (body.email || '').trim().toLowerCase();
  } catch (e) {
    return json(400, { error: 'Invalid JSON body' });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: 'Valid email required' });
  }

  try {
    const user = await getAuth().getUserByEmail(email);
    const providers = [];
    (user.providerData || []).forEach(function (p) {
      if (p.providerId && providers.indexOf(p.providerId) < 0) providers.push(p.providerId);
    });
    if (!providers.length && user.providerId) providers.push(user.providerId);
    return json(200, { exists: true, providers: providers });
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      return json(200, { exists: false, providers: [] });
    }
    console.error('[auth-providers]', e);
    return json(500, { error: 'Lookup failed' });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders()),
    body: JSON.stringify(body),
  };
}
