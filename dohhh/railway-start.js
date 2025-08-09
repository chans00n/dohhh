#!/usr/bin/env node

const dns = require('dns');
const { spawn } = require('child_process');

// Force IPv4 for all DNS lookups
dns.setDefaultResultOrder('ipv4first');

// Ensure DATABASE_URL uses the session pooler
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    
    // Force session pooler port for Supabase
    if (url.hostname.includes('supabase.co') && (!url.port || url.port === '5432')) {
      console.log('⚠️  Updating DATABASE_URL to use session pooler port 6543');
      url.port = '6543';
      
      // Ensure pgbouncer is enabled
      if (!url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true');
      }
      
      process.env.DATABASE_URL = url.toString();
    }
    
    console.log('✅ Database URL configured:');
    console.log('   Host:', url.hostname);
    console.log('   Port:', url.port);
    console.log('   Database:', url.pathname.slice(1));
    console.log('   PgBouncer:', url.searchParams.get('pgbouncer'));
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