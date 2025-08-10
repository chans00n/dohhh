# Campaign Feature Implementation Guide for Hydrogen

## Overview
This guide will help you implement the fundraising campaign features from your Medusa project into Shopify Hydrogen.

## Step 1: Campaign Data Structure in Shopify

### Create Metaobjects in Shopify Admin

1. **Navigate to:** Settings → Custom data → Metaobjects → Create metaobject

2. **Create "Campaign" metaobject:**
```
Name: Campaign
Handle: campaign

Fields:
- title (Single line text, Required)
- description (Multi-line text)
- story_content (Rich text)
- impact_content (Rich text)
- cause_name (Single line text)
- goal_amount (Decimal, Required)
- goal_cookies (Integer, Required)
- start_date (Date, Required)
- end_date (Date, Required)
- status (Single line text, Required)
  - List of values: draft, active, completed, cancelled
- featured_image (File reference - Image)
- video_url (URL)
- about_image (File reference - Image)
- organizer_name (Single line text)
- organizer_title (Single line text)
- organizer_bio (Multi-line text)
- organizer_image (File reference - Image)
```

3. **Create "Campaign Stats" metaobject:**
```
Name: Campaign Stats
Handle: campaign_stats

Fields:
- campaign (Metaobject reference - Campaign, Required)
- total_raised (Decimal)
- cookies_sold (Integer)
- backer_count (Integer)
- conversion_rate (Decimal)
- last_updated (Date and time)
```

4. **Create "Campaign Milestone" metaobject:**
```
Name: Campaign Milestone
Handle: campaign_milestone

Fields:
- campaign (Metaobject reference - Campaign, Required)
- title (Single line text, Required)
- description (Multi-line text)
- target_amount (Decimal, Required)
- target_cookies (Integer)
- achieved (Boolean)
- achieved_date (Date)
```

## Step 2: Hydrogen Component Structure

### File Structure
```
dohhh-hydrogen/
├── app/
│   ├── components/
│   │   └── Campaign/
│   │       ├── CampaignHero.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── MilestoneTracker.tsx
│   │       ├── CampaignStory.tsx
│   │       ├── BackingTiers.tsx
│   │       ├── SocialProof.tsx
│   │       └── StickySupportBar.tsx
│   ├── lib/
│   │   └── campaigns.ts
│   └── routes/
│       ├── _index.tsx (homepage with active campaign)
│       └── campaigns.$handle.tsx (individual campaign page)
```

## Step 3: Campaign Query Implementation

### `app/lib/campaigns.ts`
```typescript
import { gql } from 'graphql-tag';

export const ACTIVE_CAMPAIGN_QUERY = gql`
  query getActiveCampaign {
    metaobjects(type: "campaign", first: 1, query: "status:active") {
      edges {
        node {
          id
          handle
          fields {
            key
            value
            reference {
              ... on MediaImage {
                image {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const CAMPAIGN_STATS_QUERY = gql`
  query getCampaignStats($campaignId: ID!) {
    metaobject(id: $campaignId) {
      fields {
        key
        value
      }
    }
  }
`;

export function parseCampaignData(metaobject: any) {
  const fields = metaobject.fields.reduce((acc: any, field: any) => {
    acc[field.key] = field.value || field.reference;
    return acc;
  }, {});
  
  return {
    id: metaobject.id,
    handle: metaobject.handle,
    ...fields,
    // Calculate progress percentage
    progress: fields.goal_cookies 
      ? (fields.cookies_sold / fields.goal_cookies) * 100 
      : 0
  };
}
```

## Step 4: Campaign Components

### `app/components/Campaign/CampaignHero.tsx`
```typescript
export function CampaignHero({ campaign }: { campaign: any }) {
  return (
    <div className="relative bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4">{campaign.title}</h1>
        <p className="text-xl text-gray-600 mb-8">{campaign.description}</p>
        
        <ProgressBar 
          current={campaign.cookies_sold} 
          goal={campaign.goal_cookies}
          raised={campaign.total_raised}
        />
        
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center">
            <div className="text-3xl font-bold">${campaign.total_raised}</div>
            <div className="text-gray-600">raised</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{campaign.cookies_sold}</div>
            <div className="text-gray-600">cookies sold</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{campaign.backer_count}</div>
            <div className="text-gray-600">supporters</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### `app/components/Campaign/ProgressBar.tsx`
```typescript
export function ProgressBar({ current, goal, raised }: any) {
  const percentage = Math.min((current / goal) * 100, 100);
  
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">{current} cookies</span>
        <span className="text-sm font-medium">Goal: {goal} cookies</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 text-center text-sm text-gray-600">
        {percentage.toFixed(1)}% of goal reached
      </div>
    </div>
  );
}
```

## Step 5: Homepage Integration

### `app/routes/_index.tsx`
```typescript
import { json } from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';
import { CampaignHero } from '~/components/Campaign/CampaignHero';
import { ACTIVE_CAMPAIGN_QUERY } from '~/lib/campaigns';

export async function loader({ context }: { context: any }) {
  const { storefront } = context;
  
  // Get active campaign
  const { metaobjects } = await storefront.query(ACTIVE_CAMPAIGN_QUERY);
  const activeCampaign = metaobjects.edges[0]?.node;
  
  // Get featured products
  const { products } = await storefront.query(FEATURED_PRODUCTS_QUERY);
  
  return json({
    campaign: activeCampaign ? parseCampaignData(activeCampaign) : null,
    products
  });
}

export default function Homepage() {
  const { campaign, products } = useLoaderData();
  
  return (
    <div>
      {campaign && <CampaignHero campaign={campaign} />}
      
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Support Our Cause with Delicious Cookies
        </h2>
        <ProductGrid products={products} />
      </section>
      
      {campaign && (
        <>
          <CampaignStory campaign={campaign} />
          <MilestoneTracker campaign={campaign} />
          <BackingTiers campaign={campaign} />
        </>
      )}
    </div>
  );
}
```

## Step 6: Linking Orders to Campaigns

### Using Shopify Functions
Create a checkout extension that adds campaign data to orders:

```typescript
// extensions/campaign-tracker/src/index.ts
import { 
  Extension,
  TextField,
  useMetafield 
} from '@shopify/checkout-ui-extensions';

export default Extension('purchase.checkout.contact.render-after', 
  (root, { applyMetafieldChange }) => {
    // Add campaign ID to order metafields
    applyMetafieldChange({
      key: 'campaign_id',
      namespace: 'fundraising',
      value: activeCampaignId,
      type: 'single_line_text'
    });
  }
);
```

## Step 7: Deployment

### Deploy to Shopify Oxygen
```bash
# Install Shopify CLI
npm install -g @shopify/cli

# Log in to your store
shopify login --store your-store.myshopify.com

# Deploy to Oxygen
shopify hydrogen deploy

# Your site will be live at:
# https://your-store.myshopify.dev
```

### Custom Domain Setup
1. In Shopify Admin: Settings → Domains
2. Add your domain: dohhh.shop
3. Set as primary domain

## Next Steps

1. **Test Campaign Creation**: Create a test campaign in Shopify Admin
2. **Style Components**: Customize the design to match your brand
3. **Add Analytics**: Track campaign performance
4. **Email Integration**: Send updates to supporters
5. **Social Sharing**: Add share buttons for campaigns

## Resources

- [Shopify Hydrogen Docs](https://hydrogen.shopify.dev/)
- [Metaobjects API](https://shopify.dev/docs/api/admin-graphql/latest/objects/Metaobject)
- [Checkout Extensions](https://shopify.dev/docs/api/checkout-extensions)

## Need Help?

The campaign features are now integrated with Shopify's native systems, making them reliable and scalable. No more authentication issues!