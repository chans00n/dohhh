# Railway Deployment Guide for Medusa

## Environment Variables to Set in Railway

1. Go to your Railway project settings
2. Add the following environment variables:

### Required Variables:
```
DATABASE_URL=postgresql://postgres:B00bies0980!@db.whycrwrascteduazhmyu.supabase.co:5432/postgres?sslmode=require
STORE_CORS=https://dohhh.shop,https://www.dohhh.shop
JWT_SECRET=<generate-a-secure-random-string>
COOKIE_SECRET=<generate-a-secure-random-string>
```

### After First Deploy:
Once Railway assigns your domain, update these:
```
ADMIN_CORS=https://your-app.up.railway.app
AUTH_CORS=https://dohhh.shop,https://your-app.up.railway.app
```

## Deployment Steps:

1. Push this code to GitHub
2. Railway will automatically detect and build
3. The app will be available at the Railway-provided domain
4. Update your frontend's MEDUSA_BACKEND_URL to point to the Railway URL

## Post-Deployment:

1. Access admin at: https://your-app.up.railway.app/app
2. Login with: admin@dohhh.shop / Admin123!
3. Your API will be at: https://your-app.up.railway.app/store/*

## Notes:
- Railway provides automatic SSL
- The build process includes both backend and admin dashboard
- Port is automatically set by Railway
- Consider adding Railway's Redis add-on for better performance