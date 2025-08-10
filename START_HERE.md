# 🚀 Shopify Hydrogen - Cookie Fundraising Store

## Quick Start Guide

### Step 1: Create Your Hydrogen Project
```bash
npx create-hydrogen@latest dohhh-hydrogen
```

When prompted, select:
- Language: TypeScript
- Styling: Tailwind CSS
- Install dependencies: Yes

### Step 2: Get Shopify Credentials

1. Log into your Shopify Admin: `https://[your-store].myshopify.com/admin`
2. Go to: Settings → Apps and sales channels → Develop apps
3. Create an app called "Hydrogen Storefront"
4. Configure Storefront API scopes:
   - ✅ Read products
   - ✅ Read customers
   - ✅ Read content (metaobjects)
   - ✅ Manage checkouts
5. Install the app and copy your credentials

### Step 3: Configure Environment
Create `.env` file in your project:
```env
SESSION_SECRET="generate-random-string-here"
PUBLIC_STORE_DOMAIN="your-store.myshopify.com"
PUBLIC_STOREFRONT_API_TOKEN="your-token-here"
```

### Step 4: Create Campaign Metaobjects

In Shopify Admin → Settings → Custom data → Metaobjects:

**Campaign Object:**
- title (text)
- description (text)
- goal_amount (decimal)
- goal_cookies (integer)
- start_date (date)
- end_date (date)
- status (text: active/draft/completed)
- featured_image (file)

### Step 5: Start Development
```bash
cd dohhh-hydrogen
npm run dev
```

Visit: http://localhost:3000

### Step 6: Deploy to Production
```bash
npm run build
shopify hydrogen deploy
```

## 📁 Project Structure
```
dohhh-hydrogen/
├── app/
│   ├── components/     # Reusable components
│   ├── routes/         # Page routes
│   ├── styles/         # CSS files
│   └── lib/           # Utilities
├── public/            # Static assets
└── .env              # Environment variables
```

## 🎯 Key Features to Implement

1. **Campaign Landing Page** - Show active fundraising campaign
2. **Progress Tracking** - Real-time cookies sold vs goal
3. **Product Integration** - Link cookie sales to campaign
4. **Order Tracking** - Connect purchases to campaign stats

## 📚 Resources

- [Hydrogen Documentation](https://hydrogen.shopify.dev/)
- [Shopify Storefront API](https://shopify.dev/docs/api/storefront)
- [Metaobjects Guide](https://help.shopify.com/en/manual/custom-data/metaobjects)

## 💡 Need Help?

- Check the CAMPAIGN_IMPLEMENTATION.md for detailed component examples
- Visit Shopify Community forums
- Contact Shopify Support (they actually respond!)

---

**Remember:** No more authentication nightmares! Shopify handles it all. 🎉