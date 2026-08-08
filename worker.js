const SESSION_COOKIE = 'staff_session';
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const ACCOUNTS_KV_KEY = 'staff-accounts';

let inMemoryAccounts = null;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

function buildSessionCookie(value, maxAge) {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAge}`;
}

function toBase64Url(value) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const remainder = padded.length % 4;
  const withPadding = remainder === 0 ? padded : `${padded}${'='.repeat(4 - remainder)}`;
  return atob(withPadding);
}

async function signString(value, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  const signatureBytes = new Uint8Array(signature);
  let binary = '';
  for (const byte of signatureBytes) {
    binary += String.fromCharCode(byte);
  }
  return toBase64Url(binary);
}

async function createSessionToken(payload, secret) {
  const payloadText = JSON.stringify(payload);
  const payloadPart = toBase64Url(payloadText);
  const signaturePart = await signString(payloadPart, secret);
  return `${payloadPart}.${signaturePart}`;
}

async function verifySessionToken(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadPart, signaturePart] = parts;
  const expected = await signString(payloadPart, secret);
  if (signaturePart !== expected) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadPart));
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return null;
    }
    if (typeof payload.u !== 'string' || (payload.r !== 'staff' && payload.r !== 'admin')) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function sanitizeAccounts(accounts) {
  return accounts.map((account) => ({
    username: account.username,
    isAdmin: account.role === 'admin',
  }));
}

function seedAccounts(env) {
  const map = new Map();

  const adminUsername = normalizeUsername(env.ADMIN_USERNAME || 'admin');
  const adminPassword = String(env.ADMIN_PASSWORD || env.STAFF_PASSWORD || 'admin123');
  map.set(adminUsername, {
    username: adminUsername,
    password: adminPassword,
    role: 'admin',
  });

  const staffUsername = normalizeUsername(env.STAFF_USERNAME || 'staff');
  const staffPassword = String(env.STAFF_PASSWORD || 'password123');
  if (!map.has(staffUsername)) {
    map.set(staffUsername, {
      username: staffUsername,
      password: staffPassword,
      role: 'staff',
    });
  }

  const rawConfiguredAccounts = String(env.STAFF_ACCOUNTS_JSON || '').trim();
  if (rawConfiguredAccounts) {
    try {
      const parsed = JSON.parse(rawConfiguredAccounts);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const username = normalizeUsername(item?.username);
          const password = String(item?.password || '');
          const role = item?.role === 'admin' ? 'admin' : 'staff';
          if (!username || !password) {
            continue;
          }
          map.set(username, { username, password, role });
        }
      }
    } catch {
      // Ignore malformed configured accounts.
    }
  }

  return Array.from(map.values());
}

async function loadAccounts(env) {
  const kv = env.STAFF_ACCOUNTS_KV;
  if (kv && typeof kv.get === 'function') {
    const fromKv = await kv.get(ACCOUNTS_KV_KEY, 'json');
    if (Array.isArray(fromKv) && fromKv.length > 0) {
      return fromKv;
    }
  }

  if (inMemoryAccounts && inMemoryAccounts.length > 0) {
    return inMemoryAccounts;
  }

  const seeded = seedAccounts(env);
  inMemoryAccounts = seeded;
  if (kv && typeof kv.put === 'function') {
    await kv.put(ACCOUNTS_KV_KEY, JSON.stringify(seeded));
  }
  return seeded;
}

async function saveAccounts(env, accounts) {
  inMemoryAccounts = accounts;
  const kv = env.STAFF_ACCOUNTS_KV;
  if (kv && typeof kv.put === 'function') {
    await kv.put(ACCOUNTS_KV_KEY, JSON.stringify(accounts));
  }
}

async function getSession(context) {
  const secret = String(context.env.SESSION_SECRET || 'dev-session-secret');
  const cookies = parseCookies(context.request.headers.get('Cookie') || '');
  const token = cookies[SESSION_COOKIE];
  const payload = await verifySessionToken(token, secret);
  if (!payload) {
    return { isStaff: false, isAdmin: false, username: null };
  }
  return {
    isStaff: true,
    isAdmin: payload.r === 'admin',
    username: payload.u,
  };
}

async function requireAdmin(context) {
  const session = await getSession(context);
  if (!session.isAdmin) {
    return json({ error: 'Admin access required.' }, 403);
  }
  return null;
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce((acc, item) => {
    const idx = item.indexOf('=');
    if (idx === -1) return acc;

    const key = item.slice(0, idx).trim();
    const value = item.slice(idx + 1).trim();
    acc[key] = value;
    return acc;
  }, {});
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const { pathname } = url;
  const context = { request, env };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (pathname === '/api/staff/session' && request.method === 'GET') {
    const session = await getSession(context);
    return json(session);
  }

  if (pathname === '/api/staff/login' && request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    const username = normalizeUsername(body?.username);
    const password = String(body?.password || '').trim();

    if (!username || !password) {
      return json({ error: 'Missing staff credentials.' }, 400);
    }

    const accounts = await loadAccounts(env);
    const account = accounts.find((item) => item.username === username);
    if (!account || account.password !== password) {
      return json({ error: 'Invalid staff credentials.' }, 401);
    }

    const secret = String(env.SESSION_SECRET || 'dev-session-secret');
    const token = await createSessionToken(
      {
        u: account.username,
        r: account.role,
        exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
      },
      secret,
    );

    return json(
      {
        success: true,
        username: account.username,
        isAdmin: account.role === 'admin',
      },
      200,
      {
        'Set-Cookie': buildSessionCookie(token, SESSION_MAX_AGE_SECONDS),
      },
    );
  }

  if (pathname === '/api/staff/logout' && request.method === 'POST') {
    return json(
      { success: true },
      200,
      {
        'Set-Cookie': buildSessionCookie('', 0),
      },
    );
  }

  if (pathname === '/api/staff/accounts' && request.method === 'GET') {
    const authError = await requireAdmin(context);
    if (authError) {
      return authError;
    }
    const accounts = await loadAccounts(env);
    return json({ accounts: sanitizeAccounts(accounts) });
  }

  if (pathname === '/api/staff/accounts' && request.method === 'POST') {
    const authError = await requireAdmin(context);
    if (authError) {
      return authError;
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    const username = normalizeUsername(body?.username);
    const password = String(body?.password || '').trim();
    const isAdmin = Boolean(body?.isAdmin);

    if (!username || username.length < 3) {
      return json({ error: 'Username must be at least 3 characters.' }, 400);
    }

    if (!password || password.length < 6) {
      return json({ error: 'Password must be at least 6 characters.' }, 400);
    }

    const accounts = await loadAccounts(env);
    if (accounts.some((item) => item.username === username)) {
      return json({ error: 'An account with that username already exists.' }, 409);
    }

    const updated = [...accounts, { username, password, role: isAdmin ? 'admin' : 'staff' }];
    await saveAccounts(env, updated);

    return json({ success: true, accounts: sanitizeAccounts(updated) });
  }

  if (pathname.startsWith('/api/staff/accounts/') && request.method === 'DELETE') {
    const authError = await requireAdmin(context);
    if (authError) {
      return authError;
    }

    const currentSession = await getSession(context);
    const username = normalizeUsername(decodeURIComponent(pathname.replace('/api/staff/accounts/', '')));
    if (!username) {
      return json({ error: 'Username is required.' }, 400);
    }

    if (currentSession.username === username) {
      return json({ error: 'You cannot delete your own account while signed in.' }, 400);
    }

    const accounts = await loadAccounts(env);
    const target = accounts.find((item) => item.username === username);
    if (!target) {
      return json({ error: 'Account not found.' }, 404);
    }

    if (target.role === 'admin') {
      const adminCount = accounts.filter((item) => item.role === 'admin').length;
      if (adminCount <= 1) {
        return json({ error: 'Cannot remove the last admin account.' }, 400);
      }
    }

    const updated = accounts.filter((item) => item.username !== username);
    await saveAccounts(env, updated);
    return json({ success: true, accounts: sanitizeAccounts(updated) });
  }

  if (pathname.startsWith('/api/')) {
    return json({ error: 'Not found.' }, 404);
  }

  return null;
}

export default {
  async fetch(request, env) {
    const apiResponse = await handleApi(request, env);
    if (apiResponse) {
      return apiResponse;
    }

    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
