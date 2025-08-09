#!/usr/bin/env node

/**
 * Run Medusa migrations with proper SSL configuration for Supabase
 */

const { spawn } = require('child_process');

// First, fix the DATABASE_URL for SSL
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  
  // Fix SSL mode to avoid certificate validation issues
  url.searchParams.set('sslmode', 'no-verify');
  url.searchParams.set('pgbouncer', 'true');
  url.searchParams.set('connection_limit', '1');
  
  // Update the environment variable
  process.env.DATABASE_URL = url.toString();
  
  console.log('✅ Database URL configured for migrations:');
  console.log('   Host:', url.hostname);
  console.log('   Port:', url.port);
  console.log('   SSL Mode:', url.searchParams.get('sslmode'));
}

// Run the migrations
console.log('\n🚀 Running database migrations...\n');

const migrate = spawn('npx', ['medusa', 'db:migrate'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

migrate.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ Migrations completed successfully!');
  } else {
    console.error('\n❌ Migrations failed with exit code:', code);
  }
  process.exit(code);
});