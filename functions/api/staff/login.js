const SESSION_COOKIE = 'staff_session';
const SESSION_MAX_AGE = 8 * 60 * 60;

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

function buildCookie(value, maxAge) {
  const secure = '; Secure';
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${maxAge}`;
}

export async function onRequestPost(context) {
  const env = context.env || {};
  const expectedUsername = env.STAFF_USERNAME || 'staff';
  const expectedPassword = env.STAFF_PASSWORD || 'password123';

  let payload;
  try {
    payload = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const username = String(payload?.username || '').trim();
  const password = String(payload?.password || '').trim();

  if (!username || !password) {
    return json({ error: 'Missing staff credentials.' }, 400);
  }

  if (username !== expectedUsername || password !== expectedPassword) {
    return json({ error: 'Invalid staff credentials.' }, 401);
  }

  return json(
    { success: true },
    200,
    {
      'Set-Cookie': buildCookie('1', SESSION_MAX_AGE)
    }
  );
}

export function onRequestOptions() {
  return new Response(null, { status: 204 });
}
