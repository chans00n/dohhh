# Railway Database Connection Debug Guide

## Issue
The app is still trying to connect to port 5432 instead of 6543, which suggests the DATABASE_URL isn't being read correctly.

## Debugging Steps

### 1. Verify Environment Variables in Railway

Make sure you have set:
```
DATABASE_URL=postgresql://postgres:B00bies0980!@db.whycrwrascteduazhmyu.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
```

**Important**: Make sure there are NO quotes around the value in Railway's environment variables section.

### 2. Check Railway Logs

The `railway-check.js` script will now run before starting Medusa and will show:
- If DATABASE_URL is set
- What host and port it's trying to connect to
- All available environment variables

### 3. Alternative Solution - Use Railway PostgreSQL

If Supabase connection continues to fail, consider using Railway's PostgreSQL:

1. In Railway dashboard, click "New Service"
2. Select "PostgreSQL"
3. It will automatically create a DATABASE_URL
4. Update your backend service to use this DATABASE_URL
5. Re-run the database initialization scripts

### 4. Manual DATABASE_URL Override

If needed, you can hardcode the connection in medusa-config.js temporarily:
```javascript
databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:B00bies0980!@db.whycrwrascteduazhmyu.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
```

## What Changed

1. Created `medusa-config.js` to replace the TypeScript version
2. Added logging to see what database URL is being used
3. Created `railway-check.js` to debug environment variables
4. Updated start command to explicitly set NODE_ENV=production