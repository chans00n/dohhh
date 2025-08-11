type GraphQLResponse<T> = { data?: T; errors?: Array<{message: string}> };

export async function adminFetch<T = any>(env: Env, query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse<T>> {
  const storeDomain = env.PUBLIC_STORE_DOMAIN;
  const apiVersion = env.SHOPIFY_ADMIN_API_VERSION || '2024-10';
  const token = env.PRIVATE_ADMIN_API_ACCESS_TOKEN;
  if (!token) throw new Error('Missing PRIVATE_ADMIN_API_ACCESS_TOKEN');
  const endpoint = `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({query, variables}),
  });
  const json = (await res.json()) as GraphQLResponse<T>;
  if (!res.ok || json.errors) {
    throw new Error(`Admin fetch failed: ${res.status} ${JSON.stringify(json.errors)}`);
  }
  return json;
}

export const ADMIN_METAFIELDS_SET = `
  mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id namespace key value ownerType }
      userErrors { field message }
    }
  }
` as const;

export const ADMIN_GET_PRODUCTS_BY_IDS = `
  query getProducts($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        # custom namespace keys
        current: metafield(namespace: "custom", key: "campaign_current_quantity") { value }
        backers: metafield(namespace: "custom", key: "campaign_backer_count") { value }
        raised: metafield(namespace: "custom", key: "campaign_total_raised") { value }
        # campaign namespace keys
        currentCampaign: metafield(namespace: "campaign", key: "current_quantity") { value }
        backersCampaign: metafield(namespace: "campaign", key: "backer_count") { value }
        raisedCampaign: metafield(namespace: "campaign", key: "total_raised") { value }
        backersCustom: metafield(namespace: "custom", key: "campaign_backers") { value }
        backersFeed: metafield(namespace: "custom", key: "campaign_backers_json") { value }
      }
    }
  }
` as const;

export const ADMIN_ORDER_METAFIELDS_SET = ADMIN_METAFIELDS_SET;

export const ADMIN_GET_PRODUCT_METAFIELDS = `
  query getProductMetafields($id: ID!) {
    node(id: $id) {
      ... on Product {
        id
        metafields(first: 250) {
          edges { node { namespace key type value } }
        }
      }
    }
  }
` as const;

export const ADMIN_PRODUCTS_SEARCH_BY_HANDLE = `
  query productsByHandle($handle: String!) {
    products(first: 1, query: $handle) {
      edges { node { id handle title } }
    }
  }
` as const;

export const ADMIN_GET_PRODUCT_VARIANTS = `
  query getProductVariants($id: ID!) {
    node(id: $id) { ... on Product { variants(first: 10) { edges { node { id title } } } } }
  }
` as const;

export async function getAdminProductIdByHandle(env: Env, handle: string) {
  const res = await adminFetch<{products: {edges: Array<{node: {id: string; handle: string; title: string}}>}}>(
    env,
    ADMIN_PRODUCTS_SEARCH_BY_HANDLE,
    {handle},
  );
  return res?.data?.products?.edges?.[0]?.node?.id as string | undefined;
}

export async function getAdminMetafieldsRecord(env: Env, productId: string) {
  const res = await adminFetch<{node: {metafields: {edges: Array<{node: {namespace: string; key: string; type: string; value: string}}>} } }>(
    env,
    ADMIN_GET_PRODUCT_METAFIELDS,
    {id: productId},
  );
  const edges = res?.data?.node?.metafields?.edges || [];
  const record: Record<string, string> = {};
  for (const e of edges) {
    const n = e?.node;
    if (!n) continue;
    if (n.namespace === 'campaign' || n.namespace === 'custom.campaign') {
      record[n.key] = n.value;
    }
  }
  return record;
}

export async function getFirstVariantIdAdmin(env: Env, productId: string) {
  const res = await adminFetch<{node: {variants: {edges: Array<{node: {id: string}}>} } }>(
    env,
    ADMIN_GET_PRODUCT_VARIANTS,
    {id: productId},
  );
  return res?.data?.node?.variants?.edges?.[0]?.node?.id as string | undefined;
}

export async function setProductCampaignProgress(env: Env, productId: string, updates: {currentQuantityDelta?: number; backerCountDelta?: number; totalRaisedDelta?: number}) {
  const current = await adminFetch<{nodes: Array<any>}>(env, ADMIN_GET_PRODUCTS_BY_IDS, {ids: [productId]});
  const node = current?.data?.nodes?.[0];
  const cq = Number(node?.current?.value ?? node?.currentCampaign?.value ?? 0);
  const bc = Number(node?.backers?.value ?? node?.backersCampaign?.value ?? 0);
  const tr = Number(node?.raised?.value ?? node?.raisedCampaign?.value ?? 0);
  const newCurrentQuantity = cq + (updates.currentQuantityDelta || 0);
  const newBackerCount = bc + (updates.backerCountDelta || 0);
  const newTotalRaised = tr + (updates.totalRaisedDelta || 0);

  // Choose namespace to write: prefer existing custom keys; else use campaign keys if present; else default to custom
  const useCustom = node?.current?.value !== undefined || node?.backers?.value !== undefined || node?.raised?.value !== undefined;
  const useCampaignNs = !useCustom && (node?.currentCampaign?.value !== undefined || node?.backersCampaign?.value !== undefined || node?.raisedCampaign?.value !== undefined);

  const metas = useCustom
    ? [
        { ownerId: productId, namespace: 'custom', key: 'campaign_current_quantity', type: 'number_integer', value: String(newCurrentQuantity) },
        { ownerId: productId, namespace: 'custom', key: 'campaign_backer_count', type: 'number_integer', value: String(newBackerCount) },
        { ownerId: productId, namespace: 'custom', key: 'campaign_total_raised', type: 'number_decimal', value: String(newTotalRaised) },
      ]
    : useCampaignNs
    ? [
        { ownerId: productId, namespace: 'campaign', key: 'current_quantity', type: 'number_integer', value: String(newCurrentQuantity) },
        { ownerId: productId, namespace: 'campaign', key: 'backer_count', type: 'number_integer', value: String(newBackerCount) },
        { ownerId: productId, namespace: 'campaign', key: 'total_raised', type: 'number_decimal', value: String(newTotalRaised) },
      ]
    : [
        { ownerId: productId, namespace: 'custom', key: 'campaign_current_quantity', type: 'number_integer', value: String(newCurrentQuantity) },
        { ownerId: productId, namespace: 'custom', key: 'campaign_backer_count', type: 'number_integer', value: String(newBackerCount) },
        { ownerId: productId, namespace: 'custom', key: 'campaign_total_raised', type: 'number_decimal', value: String(newTotalRaised) },
      ];
  const res = await adminFetch<{metafieldsSet: {userErrors: Array<{field: string[]; message: string}>}}>(env, ADMIN_METAFIELDS_SET, {metafields: metas});
  const errors = res?.data?.metafieldsSet?.userErrors;
  if (errors && errors.length) {
    throw new Error(`metafieldsSet errors: ${JSON.stringify(errors)}`);
  }
  return res;
}

export async function markOrderProcessed(env: Env, orderId: string): Promise<boolean> {
  try {
    const metas = [
      { ownerId: orderId, namespace: 'campaign', key: 'processed', type: 'boolean', value: 'true' },
    ];
    const res = await adminFetch<{metafieldsSet: {userErrors: Array<{field: string[]; message: string}>}}>(env, ADMIN_ORDER_METAFIELDS_SET, {metafields: metas});
    const errors = res?.data?.metafieldsSet?.userErrors;
    if (errors && errors.length) {
      console.warn('markOrderProcessed userErrors', errors);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('markOrderProcessed failed', (e as Error).message);
    return false;
  }
}

export async function appendBackerFeed(env: Env, productId: string, entry: {name?: string; email?: string; quantity: number; amount: number; orderId: string; createdAt: string; location?: string}) {
  const current = await adminFetch<{nodes: Array<any>}>(env, ADMIN_GET_PRODUCTS_BY_IDS, {ids: [productId]});
  const node = current?.data?.nodes?.[0];
  let feed: Array<any> = [];
  
  // Try to get existing backers from the campaign_backers metafield
  try {
    feed = JSON.parse(node?.backersCustom?.value || node?.backersFeed?.value || '[]');
  } catch {}
  
  // Format the entry to match our expected structure
  const formattedEntry = {
    name: entry.name || 'ANONYMOUS',
    quantity: entry.quantity,
    amount: entry.amount,
    timestamp: entry.createdAt,
    location: entry.location || 'UNKNOWN',
    orderId: entry.orderId,
    email: entry.email
  };
  
  feed.push(formattedEntry);
  if (feed.length > 50) feed = feed.slice(-50); // Keep only last 50 entries
  
  const metas = [
    { ownerId: productId, namespace: 'custom', key: 'campaign_backers', type: 'json', value: JSON.stringify(feed) },
  ];
  await adminFetch(env, ADMIN_METAFIELDS_SET, {metafields: metas});
}

export const ADMIN_GET_ORDER_PROCESSED = `
  query getOrder($id: ID!) {
    node(id: $id) {
      ... on Order {
        id
        metafield(namespace: "campaign", key: "processed") { value }
        lineItems(first: 100) {
          edges {
            node {
              quantity
              originalTotalSet { presentmentMoney { amount } }
              product { id tags }
            }
          }
        }
      }
    }
  }
` as const;
