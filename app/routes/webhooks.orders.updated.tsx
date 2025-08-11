import {type ActionFunctionArgs} from '@shopify/remix-oxygen';
import {setProductCampaignProgress} from '~/lib/admin';

async function verify(body: string, hmac: string | null, secret?: string) {
  if (!secret || !hmac) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const digest = btoa(String.fromCharCode(...new Uint8Array(signature)));
  if (hmac.length !== digest.length) return false;
  let mismatch = 0;
  for (let i = 0; i < hmac.length; i++) mismatch |= hmac.charCodeAt(i) ^ digest.charCodeAt(i);
  return mismatch === 0;
}

export async function action({request, context}: ActionFunctionArgs) {
  const raw = await request.text();
  const ok = await verify(raw, request.headers.get('X-Shopify-Hmac-Sha256'), context.env.SHOPIFY_WEBHOOK_SECRET);
  if (!ok) return new Response('Unauthorized', {status: 401});
  // Minimal handling: if order is cancelled, subtract quantities
  let payload: any = {};
  try { payload = JSON.parse(raw); } catch {}
  if (payload?.cancelled_at) {
    const items = (payload?.line_items as any[]) || [];
    const byProduct: Record<string, number> = {};
    for (const li of items) {
      const pid = li?.product_id && `gid://shopify/Product/${li.product_id}`;
      if (!pid) continue;
      byProduct[pid] = (byProduct[pid] || 0) + Number(li?.quantity || 0);
    }
    for (const [pid, qty] of Object.entries(byProduct)) {
      await setProductCampaignProgress(context.env, pid, {
        currentQuantityDelta: -qty,
        // backer count decrement conservatively by 1 for full cancellation
        backerCountDelta: -1,
        totalRaisedDelta: 0,
      });
    }
  }
  return new Response('OK', {status: 200});
}

export default function Component() { return null; }


