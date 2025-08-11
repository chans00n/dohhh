import {type ActionFunctionArgs} from '@shopify/remix-oxygen';
import {setProductCampaignProgress, markOrderProcessed, appendBackerFeed} from '~/lib/admin';

async function verifyHmacFromBody(bodyText: string, headerHmac: string | null, secret: string | undefined) {
  if (!secret || !headerHmac) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(bodyText));
  const digest = btoa(String.fromCharCode(...new Uint8Array(signature)));
  if (headerHmac.length !== digest.length) return false;
  let mismatch = 0;
  for (let i = 0; i < headerHmac.length; i++) {
    mismatch |= headerHmac.charCodeAt(i) ^ digest.charCodeAt(i);
  }
  return mismatch === 0;
}

const PRODUCT_TAGS_QUERY = `#graphql
  query ProductTags($id: ID!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    node(id: $id) { ... on Product { id tags } }
  }
` as const;

export async function action({request, context}: ActionFunctionArgs) {
  // Read the raw body exactly once for HMAC verification and JSON parsing
  const rawBody = await request.text();
  const headerHmac = request.headers.get('X-Shopify-Hmac-Sha256');
  const ok = await verifyHmacFromBody(rawBody, headerHmac, context.env.SHOPIFY_WEBHOOK_SECRET);
  if (!ok) return new Response('Unauthorized', {status: 401});

  let payload: any = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {}
  const orderGid = payload?.admin_graphql_api_id as string | undefined;
  const lineItems = (payload?.line_items as any[]) || [];
  const items: Array<{productId: string; quantity: number; amount: number; tags: string[]}> = [];
  for (const li of lineItems) {
    const productNumericId = li?.product_id as number | undefined;
    if (!productNumericId) continue;
    const productId = `gid://shopify/Product/${productNumericId}`;
    const quantity = Number(li?.quantity || 0);
    const amount = Number((li?.price || 0) * quantity);
    items.push({productId, quantity, amount, tags: []});
  }

  const campaignItems = items.filter((i) => i.tags.includes('campaign'));
  const byProduct: Record<string, {q: number; amt: number}> = {};
  // Resolve tags via Storefront for each unique product
  const uniqueIds = Array.from(new Set(items.map((i) => i.productId)));
  const idToTags: Record<string, string[]> = {};
  for (const id of uniqueIds) {
    try {
      const res = await context.storefront.query(PRODUCT_TAGS_QUERY, {variables: {id}, cache: context.storefront.CacheNone()});
      const tags = (res?.node?.tags || []) as string[];
      idToTags[id] = tags;
    } catch {
      idToTags[id] = [];
    }
  }
  for (const it of items) {
    const tags = idToTags[it.productId] || [];
    if (!tags.includes('campaign')) continue;
    byProduct[it.productId] = byProduct[it.productId] || {q: 0, amt: 0};
    byProduct[it.productId].q += it.quantity;
    byProduct[it.productId].amt += it.amount;
  }

  for (const [productId, agg] of Object.entries(byProduct)) {
    await setProductCampaignProgress(context.env, productId, {
      currentQuantityDelta: agg.q,
      backerCountDelta: 1,
      totalRaisedDelta: agg.amt,
    });
    // Append to backer feed (best-effort)
    try {
      const customer = payload?.customer;
      const shippingAddress = payload?.shipping_address || payload?.billing_address;
      
      // Format location from shipping/billing address
      let location = 'UNKNOWN';
      if (shippingAddress) {
        const city = shippingAddress.city || '';
        const province = shippingAddress.province_code || shippingAddress.province || '';
        const country = shippingAddress.country_code || '';
        
        if (city && province) {
          location = `${city.toUpperCase()}, ${province.toUpperCase()}`;
        } else if (city) {
          location = city.toUpperCase();
        } else if (province) {
          location = province.toUpperCase();
        } else if (country) {
          location = country.toUpperCase();
        }
      }
      
      await appendBackerFeed(context.env, productId, {
        name: customer?.first_name ? `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() : undefined,
        email: customer?.email,
        quantity: agg.q,
        amount: agg.amt,
        orderId: orderGid || String(payload?.id || ''),
        createdAt: payload?.created_at || new Date().toISOString(),
        location,
      });
    } catch (e) {
      console.warn('appendBackerFeed failed', (e as Error).message);
    }
  }

  // Best-effort mark to avoid duplicate processing; don't fail webhook if missing order permission in dev
  if (orderGid) await markOrderProcessed(context.env, orderGid);
  return new Response('OK', {status: 200});
}

export default function Component() { return null; }
