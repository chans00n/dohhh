# Vercel Environment Variables Setup

## Backend (api.dohhh.shop)

These environment variables must be set in your Vercel backend project:

```bash
# Database (Required)
DATABASE_URL=postgresql://postgres:B00bies0980!@db.whycrwrascteduazhmyu.supabase.co:5432/postgres?sslmode=require

# CORS Configuration (Required)
STORE_CORS=https://dohhh.shop,https://www.dohhh.shop
ADMIN_CORS=https://api.dohhh.shop
AUTH_CORS=https://dohhh.shop,https://www.dohhh.shop,https://api.dohhh.shop

# Security (Required)
JWT_SECRET=your-secure-jwt-secret-here
COOKIE_SECRET=your-secure-cookie-secret-here

# Redis (Optional - will use fake redis if not set)
REDIS_URL=redis://your-redis-url-here

# Stripe (Required for payments)
STRIPE_API_KEY=your-stripe-secret-key-here

# Medusa Admin
MEDUSA_ADMIN_ONBOARDING_TYPE=nextjs
```

## Frontend (dohhh.shop)

These environment variables must be set in your Vercel frontend project:

```bash
# Backend URL (Required)
MEDUSA_BACKEND_URL=https://api.dohhh.shop
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.dohhh.shop

# Medusa Publishable Key (Required)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your-publishable-key-here

# Stripe (Required for payments)
NEXT_PUBLIC_STRIPE_KEY=pk_test_your-stripe-publishable-key
```

## Important Notes:

1. Make sure to generate secure random strings for JWT_SECRET and COOKIE_SECRET
2. The DATABASE_URL must include `?sslmode=require` for Supabase
3. Update CORS URLs to match your production domains
4. Get your Medusa publishable key from the admin dashboard after logging in