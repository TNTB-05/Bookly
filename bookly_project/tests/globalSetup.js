/**
 * Playwright global setup.
 *
 * Runs ONCE before the entire test suite. Ensures the demo accounts the tests
 * depend on actually exist in the database. This makes the suite work on a
 * freshly reset DB (`reset-db.sh`) without anyone having to manually create
 * users via the UI.
 *
 * Idempotent: every step treats a 409 ("already exists") as success.
 */

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000';

const CUSTOMER = {
  name: 'Test User',
  email: 'test@test.com',
  password: 'asdasdasd',
  phone: '+36301234567',
};

const PROVIDER = {
  name: 'Test Provider',
  email: 'provider@test.com',
  password: 'asdasdasd',
  phone: '+36309999999',
  salon: {
    companyName: 'Test Salon',
    address: 'Andrássy út 1, Budapest',
    description: 'Automated test salon created by Playwright global setup.',
    salonType: 'fodrász',
    latitude: 47.5028,
    longitude: 19.0594,
  },
};

async function postJson(path, body, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch (_) { /* ignore */ }
  return { status: res.status, body: json };
}

async function putJson(path, body, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch (_) { /* ignore */ }
  return { status: res.status, body: json };
}

async function ensureCustomer() {
  const reg = await postJson('/auth/register', {
    name: CUSTOMER.name,
    email: CUSTOMER.email,
    password: CUSTOMER.password,
  });

  if (reg.status === 201) {
    console.log(`[setup] Created customer ${CUSTOMER.email}`);
  } else if (reg.status === 409) {
    console.log(`[setup] Customer ${CUSTOMER.email} already exists`);
  } else {
    throw new Error(`Customer registration failed: ${reg.status} ${JSON.stringify(reg.body)}`);
  }

  // Log in to get a token so we can set the phone (booking flow requires it)
  const login = await postJson('/auth/login', {
    email: CUSTOMER.email,
    password: CUSTOMER.password,
  });
  if (login.status !== 200) {
    throw new Error(`Customer login failed: ${login.status} ${JSON.stringify(login.body)}`);
  }
  const token = login.body.accessToken;

  const profile = await putJson('/api/user/profile', {
    name: CUSTOMER.name,
    email: CUSTOMER.email,
    phone: CUSTOMER.phone,
  }, token);
  // 200 = updated, 409 = no changes (also fine)
  if (profile.status !== 200 && profile.status !== 409) {
    throw new Error(`Customer profile update failed: ${profile.status} ${JSON.stringify(profile.body)}`);
  }
  console.log(`[setup] Customer ${CUSTOMER.email} ready (phone set)`);
}

async function ensureProvider() {
  // First try to log in — if that succeeds the provider already exists
  const existing = await postJson('/auth/provider/login', {
    email: PROVIDER.email,
    password: PROVIDER.password,
  });
  if (existing.status === 200) {
    console.log(`[setup] Provider ${PROVIDER.email} already exists`);
    return;
  }

  const reg = await postJson('/auth/provider/register', {
    name: PROVIDER.name,
    email: PROVIDER.email,
    password: PROVIDER.password,
    phone: PROVIDER.phone,
    registrationType: 'create',
    salon: PROVIDER.salon,
  });

  if (reg.status === 201) {
    console.log(`[setup] Created provider ${PROVIDER.email} with salon "${PROVIDER.salon.companyName}"`);
  } else if (reg.status === 409) {
    console.log(`[setup] Provider ${PROVIDER.email} already exists (409)`);
  } else {
    throw new Error(`Provider registration failed: ${reg.status} ${JSON.stringify(reg.body)}`);
  }
}

export default async function globalSetup() {
  console.log(`[setup] Ensuring demo accounts exist via ${API_URL} ...`);

  // Quick sanity check: backend is reachable
  try {
    await fetch(`${API_URL}/test`);
  } catch (err) {
    throw new Error(
      `Backend not reachable at ${API_URL}. Start it with "npm run dev" in bookly_project/backend before running tests.\n` +
      `Original error: ${err.message}`
    );
  }

  await ensureCustomer();
  await ensureProvider();

  console.log('[setup] All demo accounts ready.');
}
