# Dohhh: Artisan Cookie Crowdfunding (Hydrogen + Remix)

Dohhh is a Shopify Hydrogen storefront that sells cookies through time-limited, goal‑oriented crowdfunding campaigns.

## Quick start

1) Install deps

```bash
npm install
```

2) Environment variables (create `.env` or Oxygen variables)

```
PUBLIC_STORE_DOMAIN=your-store.myshopify.com
PUBLIC_STOREFRONT_ID=xxxxxx
PUBLIC_STOREFRONT_API_TOKEN=shpat_xxxxx
PUBLIC_CHECKOUT_DOMAIN=checkout.shopify.com
SESSION_SECRET=dev-secret

# Admin API (required for webhooks + metafield writes)
PRIVATE_ADMIN_API_ACCESS_TOKEN=shppa_xxx
SHOPIFY_ADMIN_API_VERSION=2024-10
SHOPIFY_WEBHOOK_SECRET=whsec_xxx
```

3) Dev server

```bash
npm run dev
```

Open `/campaigns` to see live campaign data from Shopify products tagged `campaign`.

## Metafields schema

Namespace: `campaign`
- `slug` (single_line_text_field) — recommended equal to Product handle
- `description` (multi_line_text_field)
- `story_html` (multi_line_text_field)
- `goal_quantity` (number_integer)
- `deadline` (single_line_text_field ISO string)
- `status` (single_line_text_field: draft|active|funded|completed|cancelled)
- `delivery_methods` (json)
- Progress (updated by webhook):
  - `current_quantity` (number_integer)
  - `backer_count` (number_integer)
  - `total_raised` (number_decimal)

Tag every campaign product with `campaign`.

## Data flow

- Storefront queries products tagged `campaign` and reads metafields for display
- Checkout: creates cart for a variant and redirects to Shopify checkout
- Webhook `/webhooks/orders/create`: increments progress metafields for any `campaign` products purchased in the order (idempotent via order metafield `campaign.processed=true`)
- Admin page `/admin/campaigns`: edit campaign metafields

## Shopify setup

1) Create a custom app with Admin API + Storefront API access; copy tokens/secrets to env
2) Create the metafield definitions above (Product scope, namespace `campaign`)
3) Add a `campaign` product tag to each campaign product
4) Configure webhooks: `orders/create` to `https://your-domain/webhooks/orders/create` (HMAC secret = `SHOPIFY_WEBHOOK_SECRET`)

## Notes

- Campaign slugs resolve via product handle; set `slug` metafield if you need a different URL
- Progress percentage is computed from `current_quantity / goal_quantity`
