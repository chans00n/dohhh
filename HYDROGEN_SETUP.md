# 🚀 Shopify Hydrogen Setup Instructions

## Prerequisites Completed ✅
- [x] Important code backed up to `/Users/chanson/MEDUSA_BACKUP`
- [x] Old Medusa project removed
- [x] Clean directory ready for new project

## Next Steps to Complete

### 1. Install Hydrogen CLI and Create Project
Open your terminal and run:

```bash
# Navigate to the clean directory
cd /Users/chanson/MEDUSA

# Create a new Hydrogen project
npx create-hydrogen@latest

# When prompted:
# - Project name: dohhh-hydrogen
# - Language: TypeScript
# - Styling: Tailwind CSS
# - Install dependencies: Yes
```

### 2. Get Your Shopify Store Credentials

1. **Log into your Shopify Admin**
   - Go to: `https://[your-store].myshopify.com/admin`

2. **Create a Custom App for Hydrogen**
   - Navigate to: Settings → Apps and sales channels → Develop apps
   - Click "Create an app"
   - Name it: "Hydrogen Storefront"

3. **Configure API Scopes**
   - Click on "Configure Storefront API scopes"
   - Enable these permissions:
     - ✅ unauthenticated_read_product_listings
     - ✅ unauthenticated_read_product_inventory
     - ✅ unauthenticated_read_customers
     - ✅ unauthenticated_read_content (for metaobjects)
     - ✅ unauthenticated_write_checkouts
     - ✅ unauthenticated_read_checkouts

4. **Install the App and Get Credentials**
   - Click "Install app"
   - Copy these values:
     - Storefront API access token
     - API key
     - API secret key
     - Your store domain (e.g., `your-store.myshopify.com`)

### 3. Configure Environment Variables

Create a `.env` file in your project:

```env
SESSION_SECRET="generate-a-random-string-here"
PUBLIC_STORE_DOMAIN="your-store.myshopify.com"
PUBLIC_STOREFRONT_API_TOKEN="your-storefront-api-token"
PUBLIC_STOREFRONT_ID="gid://shopify/Storefront/YOUR_ID"
```

### 4. Create Metaobjects for Campaigns

In Shopify Admin, go to Settings → Custom data → Metaobjects

Create a new metaobject definition called `campaign`:

```
Fields to add:
- title (Single line text)
- description (Multi-line text)
- story_content (Rich text)
- impact_content (Rich text)
- cause_name (Single line text)
- goal_amount (Decimal)
- goal_cookies (Integer)
- start_date (Date)
- end_date (Date)
- status (Single line text) - Values: draft, active, completed
- featured_image (File - Image)
- video_url (URL)
- organizer_name (Single line text)
- organizer_title (Single line text)
- organizer_bio (Multi-line text)
- organizer_image (File - Image)
```

Create another metaobject called `campaign_stats`:

```
Fields to add:
- campaign (Metaobject reference - campaign)
- total_raised (Decimal)
- cookies_sold (Integer)
- backer_count (Integer)
- last_updated (Date and time)
```

### 5. Quick Start Commands

Once you have the project created:

```bash
cd dohhh-hydrogen

# Install dependencies (if not done)
npm install

# Start development server
npm run dev

# Your store will be at http://localhost:3000
```

### 6. Test Your Connection

Create a test file `app/routes/test.tsx`:

```typescript
import { json } from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';

export async function loader({ context }) {
  const { storefront } = context;
  
  const { shop } = await storefront.query(`
    query {
      shop {
        name
        primaryDomain {
          url
        }
      }
    }
  `);

  return json({ shop });
}

export default function Test() {
  const { shop } = useLoaderData();
  return (
    <div>
      <h1>Connected to: {shop.name}</h1>
      <p>URL: {shop.primaryDomain.url}</p>
    </div>
  );
}
```

Visit `http://localhost:3000/test` to verify the connection works.

## 🎯 Ready to Code!

Once you complete these steps, we can:
1. Build the campaign components
2. Set up product pages
3. Implement the fundraising features
4. Deploy to production

## Need Help?

If you encounter any issues:
- Shopify Hydrogen Docs: https://hydrogen.shopify.dev/
- Shopify Community: https://community.shopify.com/
- Or ask me to help with the implementation!