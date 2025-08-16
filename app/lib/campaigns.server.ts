import type {Campaign} from './campaigns';
import {getAdminMetafieldsRecord} from '~/lib/admin';

function getMetaValue(product: any, key: string) {
  // Prefer aliased single metafields for reliability
  const aliasMap: Record<string, string> = {
    name: 'campaignName',
    slug: 'campaignSlug',
    description: 'campaignDescription',
    story_html: 'campaignStory',
    goal_quantity: 'campaignGoalQuantity',
    deadline: 'campaignDeadline',
    status: 'campaignStatus',
    delivery_methods: 'campaignDeliveryMethods',
    current_quantity: 'campaignCurrentQuantity',
    backer_count: 'campaignBackerCount',
    total_raised: 'campaignTotalRaised',
    video: 'campaignVideo',
  };
  const alias = aliasMap[key];
  if (alias && product && product[alias] && typeof product[alias].value !== 'undefined') {
    return product[alias].value;
  }
  // Try custom namespace aliases if present
  const customAliasMap: Record<string, string> = {
    name: 'campaignNameCustom',
    slug: 'campaignSlugCustom',
    description: 'campaignDescriptionCustom',
    story_html: 'campaignStoryCustom',
    goal_quantity: 'campaignGoalQuantityCustom',
    deadline: 'campaignDeadlineCustom',
    status: 'campaignStatusCustom',
    delivery_methods: 'campaignDeliveryMethodsCustom',
    current_quantity: 'campaignCurrentQuantityCustom',
    backer_count: 'campaignBackerCountCustom',
    total_raised: 'campaignTotalRaisedCustom',
    video: 'campaignVideoCustom',
  };
  // Namespace: custom with prefixed keys
  const customNsAliasMap: Record<string, string> = {
    name: 'campaignNameCustomNs',
    slug: 'campaignSlugCustomNs',
    description: 'campaignDescriptionCustomNs',
    story_html: 'campaignStoryHtmlCustomNs',
    goal_quantity: 'campaignGoalQuantityCustomNs',
    deadline: 'campaignDeadlineCustomNs',
    status: 'campaignStatusCustomNs',
    delivery_methods: 'campaignDeliveryMethodsJsonCustomNs',
    current_quantity: 'campaignCurrentQuantityCustomNs',
    backer_count: 'campaignBackerCountCustomNs',
    total_raised: 'campaignTotalRaisedCustomNs',
    video: 'campaignVideoCustomNs',
  };
  const customNs = customNsAliasMap[key];
  if (customNs && product && product[customNs] && typeof product[customNs].value !== 'undefined') {
    return product[customNs].value;
  }
  const customAlias = customAliasMap[key];
  if (customAlias && product && product[customAlias] && typeof product[customAlias].value !== 'undefined') {
    return product[customAlias].value;
  }
  // Fallback to identifiers array
  const list: Array<any | null | undefined> = product?.metafields || [];
  for (const m of list) {
    if (m && m.key === key && (m.namespace === 'campaign' || m.namespace === 'custom.campaign')) return m.value ?? null;
  }
  return null;
}

export function productToCampaign(product: any): Campaign | null {
  const slug = (getMetaValue(product, 'slug') as string) || product.handle;
  if (!slug) return null;
  const goalQuantity = Number(getMetaValue(product, 'goal_quantity') ?? '0');
  const deadline = (getMetaValue(product, 'deadline') as string) || '';
  const status = (getMetaValue(product, 'status') || 'active') as Campaign['status'];
  const currentQuantity = Number(getMetaValue(product, 'current_quantity') ?? '0');
  const backerCount = Number(getMetaValue(product, 'backer_count') ?? '0');
  const totalRaised = Number(getMetaValue(product, 'total_raised') ?? '0');
  // Get both plain text and rich text descriptions
  const description = getMetaValue(product, 'description') || '';
  // Try to get description_rich from multiple possible locations
  let description_rich = product.campaignDescriptionRich?.value || '';
  
  // If not found in aliased field, check metafields array
  if (!description_rich && product.metafields) {
    // First try campaign namespace
    let richTextField = product.metafields.find((m: any) => 
      m && m.key === 'description_rich' && m.namespace === 'campaign'
    );
    
    // If not found, try custom namespace with campaign_description_rich
    if (!richTextField) {
      richTextField = product.metafields.find((m: any) => 
        m && m.key === 'campaign_description_rich' && m.namespace === 'custom'
      );
    }
    
    if (richTextField) {
      description_rich = richTextField.value || '';
    }
  }
  const story = getMetaValue(product, 'story_html') || '';
  const deliveryMethodsJson = getMetaValue(product, 'delivery_methods') || '[]';
  let deliveryMethods: Campaign['deliveryMethods'] = [];
  try { deliveryMethods = JSON.parse(deliveryMethodsJson) as Campaign['deliveryMethods']; } catch {}

  const percentage = goalQuantity > 0 ? Math.min(100, Math.round((currentQuantity / goalQuantity) * 100)) : 0;

  const defaultVariantId = product?.variants?.nodes?.[0]?.id || '';

  const name = (getMetaValue(product, 'name') as string) || product.title;
  
  // Extract images from product - use all images if available, fallback to featured image
  let images: Array<{ url: string; altText: string }> = [];
  if (product.images?.nodes && product.images.nodes.length > 0) {
    images = product.images.nodes.map((img: any) => ({
      url: img.url,
      altText: img.altText || ''
    }));
  } else if (product.featuredImage) {
    images = [{ url: product.featuredImage.url, altText: product.featuredImage.altText || '' }];
  }
  
  // Extract price from first variant
  const price = product.variants?.nodes?.[0]?.price?.amount ? parseFloat(product.variants.nodes[0].price.amount) : 30;
  
  // Extract video URL from metafield
  const video = getMetaValue(product, 'video') as string || '';

  return {
    id: product.id,
    shopifyProductId: product.id,
    name,
    slug,
    description,
    description_rich,
    story,
    organizerInfo: { name: 'Organizer', avatar: product.featuredImage?.url || '', bio: '' },
    goal: { quantity: goalQuantity, deadline },
    progress: { currentQuantity, percentage, totalRaised, backerCount },
    status,
    milestones: [],
    socialProof: { backerTiers: [], testimonials: [] },
    deliveryMethods,
    images,
    price,
    video,
  };
}

export async function hydrateCampaignFromAdmin(env: Env, product: any): Promise<Campaign | null> {
  const productId = product?.id as string | undefined;
  if (!productId) return null;
  const mf = await getAdminMetafieldsRecord(env, productId);
  const name = mf['name'] || product?.title || '';
  const slug = mf['slug'] || product?.handle || '';
  if (!slug) return null;
  const goalQuantity = Number(mf['goal_quantity'] || '0');
  const deadline = mf['deadline'] || '';
  const status = (mf['status'] || 'active') as Campaign['status'];
  const currentQuantity = Number(mf['current_quantity'] || '0');
  const backerCount = Number(mf['backer_count'] || '0');
  const totalRaised = Number(mf['total_raised'] || '0');
  let deliveryMethods: Campaign['deliveryMethods'] = [];
  try { deliveryMethods = JSON.parse(mf['delivery_methods'] || '[]') as Campaign['deliveryMethods']; } catch {}
  
  // Extract images and price - use all images if available, fallback to featured image
  let images: Array<{ url: string; altText: string }> = [];
  if (product?.images?.nodes && product.images.nodes.length > 0) {
    images = product.images.nodes.map((img: any) => ({
      url: img.url,
      altText: img.altText || ''
    }));
  } else if (product?.featuredImage) {
    images = [{ url: product.featuredImage.url, altText: product.featuredImage.altText || '' }];
  }
  const price = product?.variants?.nodes?.[0]?.price?.amount ? parseFloat(product.variants.nodes[0].price.amount) : 30;
  
  // Extract video URL from metafield
  const video = mf['video'] || '';
  
  return {
    id: productId,
    shopifyProductId: productId,
    name,
    slug,
    description: mf['description'] || '',
    story: mf['story_html'] || '',
    organizerInfo: { name: 'Organizer', avatar: product?.featuredImage?.url || '', bio: '' },
    goal: { quantity: goalQuantity, deadline },
    progress: { currentQuantity, percentage: goalQuantity > 0 ? Math.min(100, Math.round((currentQuantity / goalQuantity) * 100)) : 0, totalRaised, backerCount },
    status,
    milestones: [],
    socialProof: { backerTiers: [], testimonials: [] },
    deliveryMethods,
    images,
    price,
    video,
  };
}
