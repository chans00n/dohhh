#!/usr/bin/env node

const { fixDatabaseUrl } = require('./database-fix');
const { spawn } = require('child_process');

async function start() {
  console.log('🔧 Fixing database connection for Railway...\n');
  
  // Fix the database URL to use IPv4
  await fixDatabaseUrl();
  
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