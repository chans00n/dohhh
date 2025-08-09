#!/usr/bin/env node

console.log('=== Railway Environment Debug ===\n');

// Check critical environment variables
const requiredVars = [
  'DATABASE_URL',
  'RAILWAY_ENVIRONMENT',
  'NODE_ENV',
  'PORT'
];

console.log('Environment Variables Check:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName === 'DATABASE_URL') {
      // Mask the password in DATABASE_URL
      const masked = value.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
      console.log(`✅ ${varName}: ${masked}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n=== DATABASE_URL Configuration ===\n');

if (!process.env.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL is not set in environment variables!');
  console.log('\nTo fix this:');
  console.log('1. Go to your Railway project dashboard');
  console.log('2. Click on your service (dohhh)');
  console.log('3. Go to the "Variables" tab');
  console.log('4. Add DATABASE_URL with your Supabase connection string:');
  console.log('   postgresql://postgres:YOUR_PASSWORD@db.whycrwrascteduazhmyu.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1');
  console.log('\n5. Make sure to use port 6543 (session pooler) not 5432');
  console.log('6. Redeploy your service');
  
  // List all available env vars (excluding sensitive ones)
  console.log('\nAvailable environment variables:');
  const envVars = Object.keys(process.env)
    .filter(k => !k.includes('SECRET') && !k.includes('KEY') && !k.includes('PASSWORD') && !k.includes('TOKEN'))
    .sort();
  console.log(envVars.join(', '));
} else {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('Database Configuration:');
    console.log('  Host:', url.hostname);
    console.log('  Port:', url.port || '5432');
    console.log('  Database:', url.pathname.slice(1));
    console.log('  PgBouncer:', url.searchParams.get('pgbouncer') || 'false');
    console.log('  Connection Limit:', url.searchParams.get('connection_limit') || 'not set');
    
    // Check if using the correct pooler configuration
    if (url.hostname === 'aws-0-us-west-1.pooler.supabase.com') {
      console.log('\n✅ Using Supabase session pooler (correct configuration)');
    } else if (url.hostname.includes('supabase.co') && url.hostname.startsWith('db.')) {
      console.log('\n⚠️  WARNING: Using direct connection instead of session pooler');
      console.log('  This may cause connection issues on Railway');
      console.log('  Update to use: aws-0-us-west-1.pooler.supabase.com');
    }
  } catch (e) {
    console.log('❌ Invalid DATABASE_URL format:', e.message);
  }
}

console.log('\n=== Additional Environment Variables ===\n');
const additionalVars = [
  'JWT_SECRET',
  'COOKIE_SECRET',
  'STORE_CORS',
  'ADMIN_CORS',
  'AUTH_CORS',
  'STRIPE_API_KEY'
];

additionalVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${value ? '✅' : '⚠️ '} ${varName}: ${value ? 'SET' : 'NOT SET (may be required)'}`);
});

console.log('\n================================\n');