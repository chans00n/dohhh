// campaign types, mock data, and helpers
export type DeliveryType = 'pickup' | 'local_delivery' | 'shipping';

export interface Campaign {
  id: string;
  shopifyProductId: string;
  name: string;
  slug: string;
  description: string;
  story: string;
  organizerInfo: { name: string; avatar: string; bio: string };
  goal: { quantity: number; deadline: string };
  progress: { currentQuantity: number; percentage: number; totalRaised: number; backerCount: number };
  status: 'draft' | 'active' | 'funded' | 'completed' | 'cancelled';
  milestones: Array<{ percentage: number; title: string; description: string; unlocked: boolean }>;
  socialProof: { backerTiers: Array<any>; testimonials: Array<any> };
  deliveryMethods: Array<{ type: DeliveryType; price: number; description: string }>;
  images?: Array<{ url: string; altText?: string }>;
  price?: number;
  video?: string;
}

// Mock data removed - Using real Shopify data only
// Campaign data is loaded from Shopify Admin API metafields
// and real-time order/webhook data

export function formatDeadline(deadlineIso: string): string {
  const d = new Date(deadlineIso);
  return d.toLocaleString();
}
