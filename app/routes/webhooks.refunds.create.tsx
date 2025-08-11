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
  let payload: any = {};
  try { payload = JSON.parse(raw); } catch {}
  // Refund payload contains refund_line_items referencing the order line items; we credit back quantity and amount
  const items = (payload?.refund_line_items as any[]) || [];
  const byProduct: Record<string, {q: number; amt: number}> = {};
  for (const rli of items) {
    const li = rli?.line_item;
    const pid = li?.product_id && `gid://shopify/Product/${li.product_id}`;
    if (!pid) continue;
    const qty = Number(rli?.quantity || 0);
    const amt = Number((li?.price || 0) * qty);
    byProduct[pid] = byProduct[pid] || {q: 0, amt: 0};
    byProduct[pid].q += qty;
    byProduct[pid].amt += amt;
  }
  for (const [pid, agg] of Object.entries(byProduct)) {
    await setProductCampaignProgress(context.env, pid, {
      currentQuantityDelta: -agg.q,
      totalRaisedDelta: -agg.amt,
    });
  }
  return new Response('OK', {status: 200});
}

export default function Component() { return null; }


