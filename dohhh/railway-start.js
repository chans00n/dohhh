#!/usr/bin/env node

const { fixSupabaseConnection } = require('./supabase-fix');
const { spawn } = require('child_process');

async function start() {
  console.log('🔧 Checking Railway database configuration...\n');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ CRITICAL ERROR: DATABASE_URL is not set!');
    console.error('\n📝 To fix this issue:');
    console.error('1. Go to your Railway project dashboard');
    console.error('2. Click on your service (dohhh)');
    console.error('3. Go to the "Variables" tab');
    console.error('4. Add DATABASE_URL with your Supabase connection string');
    console.error('5. Use this format with port 6543 (session pooler):');
    console.error('   postgresql://postgres:YOUR_PASSWORD@db.whycrwrascteduazhmyu.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1');
    console.error('\n6. Save and redeploy\n');
    
    // Exit with error
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL is set\n');
  console.log('🔧 Fixing Supabase connection for Railway...\n');
  
  // Fix the database URL to use IPv4 and proper pooler
  const fixed = await fixSupabaseConnection();
  
  if (!fixed) {
    console.error('Failed to configure Supabase connection');
    console.error('Please check your DATABASE_URL configuration');
    process.exit(1);
  }
  
  // Log the configuration
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      console.log('✅ Database URL configured:');
      console.log('   Host:', url.hostname);
      console.log('   Port:', url.port);
      console.log('   Database:', url.pathname.slice(1));
      console.log('   PgBouncer:', url.searchParams.get('pgbouncer'));
      console.log('   SSL Mode:', url.searchParams.get('sslmode'));
    } catch (e) {
      console.error('❌ Error processing DATABASE_URL:', e.message);
    }
  }
  
  // Start Medusa with the corrected configuration
  console.log('\n🚀 Starting Medusa server...\n');
  
  const medusa = spawn('yarn', ['start'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--dns-result-order=ipv4first'
    }
  });
  
  medusa.on('exit', (code) => {
    process.exit(code);
  });
}

start().catch(error => {
  console.error('Failed to start:', error);
  process.exit(1);
});