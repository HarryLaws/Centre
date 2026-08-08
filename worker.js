const SESSION_COOKIE = 'staff_session';
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

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

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (pathname === '/api/staff/session' && request.method === 'GET') {
    const cookies = parseCookies(request.headers.get('Cookie') || '');
    return json({ isStaff: cookies[SESSION_COOKIE] === '1' });
  }

  if (pathname === '/api/staff/login' && request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    const username = String(body?.username || '').trim();
    const password = String(body?.password || '').trim();

    if (!username || !password) {
      return json({ error: 'Missing staff credentials.' }, 400);
    }

    const expectedUsername = env.STAFF_USERNAME || 'staff';
    const expectedPassword = env.STAFF_PASSWORD || 'password123';

    if (username !== expectedUsername || password !== expectedPassword) {
      return json({ error: 'Invalid staff credentials.' }, 401);
    }

    return json(
      { success: true },
      200,
      {
        'Set-Cookie': buildSessionCookie('1', SESSION_MAX_AGE_SECONDS),
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
