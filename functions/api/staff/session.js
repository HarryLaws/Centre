const SESSION_COOKIE = 'staff_session';

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return acc;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    acc[key] = value;
    return acc;
  }, {});
}

export function onRequestGet(context) {
  const cookieHeader = context.request.headers.get('Cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const isStaff = cookies[SESSION_COOKIE] === '1';

  return new Response(JSON.stringify({ isStaff }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export function onRequestOptions() {
  return new Response(null, { status: 204 });
}
