# Required Railway Environment Variables

Make sure these are set in your Railway project settings:

## Required Variables

```
JWT_SECRET=your-super-secret-jwt-key-change-this
COOKIE_SECRET=your-super-secret-cookie-key-change-this
DATABASE_URL=[Your Supabase connection string]
RAILWAY_PUBLIC_DOMAIN=admin.dohhh.shop
NODE_ENV=production
PORT=8080
```

## CORS Variables (Optional, defaults are set in code)

```
ADMIN_CORS=https://admin.dohhh.shop,http://localhost:8888
AUTH_CORS=https://admin.dohhh.shop,https://dohhh.shop,https://www.dohhh.shop,http://localhost:8888
STORE_CORS=https://dohhh.shop,https://www.dohhh.shop
```

## To Set in Railway:

1. Go to your Railway project
2. Click on your service
3. Go to "Variables" tab
4. Add each variable above
5. Save and redeploy

## Important Notes:

- JWT_SECRET and COOKIE_SECRET must be set for authentication to work
- These should be long, random strings in production
- The DATABASE_URL should be your Supabase session pooler URL