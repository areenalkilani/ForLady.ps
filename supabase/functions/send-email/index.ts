const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'For Lady <no-reply@example.com>';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ADMIN_EMAIL = (Deno.env.get('ADMIN_EMAIL') || 'hassahfayg@gmail.com').toLowerCase();

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

async function isAuthorized(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!token) return false;
  if (SERVICE_ROLE && token === SERVICE_ROLE) return true;
  if (!SUPABASE_URL || !SERVICE_ROLE) return false;

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!userResponse.ok) return false;

  const user = await userResponse.json();
  const email = String(user.email || '').toLowerCase();
  if (email === ADMIN_EMAIL) return true;

  const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,email`, {
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
    },
  });
  if (!profileResponse.ok) return false;

  const [profile] = await profileResponse.json();
  return profile?.role === 'admin' || String(profile?.email || '').toLowerCase() === ADMIN_EMAIL;
}

function isValidEmailPayload(payload: any) {
  const recipients = Array.isArray(payload?.to) ? payload.to : [payload?.to];
  return recipients.length > 0
    && recipients.every((recipient) => typeof recipient === 'string' && recipient.includes('@') && recipient.length <= 320)
    && typeof payload?.subject === 'string'
    && payload.subject.trim().length > 0
    && payload.subject.length <= 200
    && typeof payload?.html === 'string'
    && payload.html.trim().length > 0
    && payload.html.length <= 200_000;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!RESEND_API_KEY) return json({ error: 'Email service is not configured' }, 500);
  if (!(await isAuthorized(req))) return json({ error: 'Forbidden' }, 403);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!isValidEmailPayload(payload)) return json({ error: 'Invalid email payload' }, 400);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
});
