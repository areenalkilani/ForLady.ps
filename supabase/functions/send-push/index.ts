import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;

webpush.setVapidDetails('mailto:hassahfayg@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const { user_id, title, body, data } = await req.json();

  const subscriptions = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${user_id}&select=subscription`, {
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
