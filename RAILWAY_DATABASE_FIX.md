# Railway Database Connection Fix

## The Issue
Railway is trying to connect to Supabase using IPv6, which is failing with ENETUNREACH errors.

## Solution Options:

### Option 1: Force IPv4 in Database URL (Recommended)
Update your DATABASE_URL in Railway to:
```
postgresql://postgres:B00bies0980!@db.whycrwrascteduazhmyu.supabase.co:5432/postgres?sslmode=require&host=db.whycrwrascteduazhmyu.supabase.co
```

### Option 2: Use Supabase Pooler Connection
If the above doesn't work, try the pooler connection string:
```
postgresql://postgres:B00bies0980!@db.whycrwrascteduazhmyu.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
```
Note: Port 6543 is the pooler port

### Option 3: Use Railway's PostgreSQL
1. Add PostgreSQL service in Railway
2. Use the provided DATABASE_URL
3. Re-run the database initialization scripts

## Updated Environment Variables for Railway:

```bash
# Database (try each option)
DATABASE_URL=<use one of the options above>

# CORS  
STORE_CORS=https://dohhh.shop,https://www.dohhh.shop
ADMIN_CORS=https://admin.dohhh.shop
AUTH_CORS=https://dohhh.shop,https://www.dohhh.shop,https://admin.dohhh.shop

# Security
JWT_SECRET=<your-secure-jwt-secret>
COOKIE_SECRET=<your-secure-cookie-secret>

# Stripe
STRIPE_API_KEY=<your-stripe-secret-key>
```

## After Updating:
1. Save the environment variables
2. Trigger a redeploy in Railway
3. Monitor the logs for successful database connection