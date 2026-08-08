const SESSION_COOKIE = 'staff_session';

function expiredCookie() {
  const secure = '; Secure';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=0`;
}

export function onRequestPost() {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': expiredCookie()
    }
  });
}

export function onRequestOptions() {
  return new Response(null, { status: 204 });
}
