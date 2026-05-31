import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const ADMIN_EMAIL = (Deno.env.get('ADMIN_EMAIL') || 'hassahfayg@gmail.com').toLowerCase();

webpush.setVapidDetails('mailto:hassahfayg@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

async function isAuthorized(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!token) return false;
  if (SERVICE_ROLE && token === SERVICE_ROLE) return true;

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

function isUuid(value: unknown) {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  if (!(await isAuthorized(req))) return Response.json({ error: 'Forbidden' }, { status: 403 });

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { user_id, title, body, data } = payload;
  if (!isUuid(user_id)
    || typeof title !== 'string'
    || title.trim().length === 0
    || title.length > 120
    || typeof body !== 'string'
    || body.trim().length === 0
    || body.length > 500
  ) {
    return Response.json({ error: 'Invalid push payload' }, { status: 400 });
  }

  const subscriptions = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${encodeURIComponent(user_id)}&select=subscription`, {
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
    },
  }).then((r) => r.json());

  await Promise.all(
    subscriptions.map((row: any) =>
      webpush.sendNotification(row.subscription, JSON.stringify({ title, body, data })).catch(() => undefined)
    )
  );

  return Response.json({ ok: true, sent: subscriptions.length });
});
