#!/usr/bin/env node

/**
 * Fix database migrations for Medusa
 */

const { spawn } = require('child_process');

async function fixMigrations() {
  console.log('🔧 Fixing database migrations...\n');
  
  // First, fix the DATABASE_URL for SSL
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    url.searchParams.set('sslmode', 'no-verify');
    url.searchParams.set('pgbouncer', 'true');
    url.searchParams.set('connection_limit', '1');
    process.env.DATABASE_URL = url.toString();
    
    console.log('✅ Database URL configured for migrations');
    console.log('   Host:', url.hostname);
    console.log('   Port:', url.port);
  }
  
  // Run sync-links to ensure all columns exist
  console.log('\n📦 Running database sync-links...\n');
  
  await new Promise((resolve, reject) => {
    const sync = spawn('npx', ['medusa', 'db:sync-links'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    sync.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Database sync-links completed');
        resolve();
      } else {
        console.log('⚠️  Database sync-links failed (this is okay, continuing...)');
        // Don't reject - continue with migrations
        resolve();
      }
    });
  });
  
  // Now run migrations
  console.log('\n🚀 Running database migrations...\n');
  
  await new Promise((resolve, reject) => {
    const migrate = spawn('npx', ['medusa', 'db:migrate'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    migrate.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Migrations completed');
        resolve();
      } else {
        console.error('❌ Migrations failed with code:', code);
        reject(new Error('Migration failed'));
      }
    });
  });
  
  console.log('\n✅ Database fixes complete!');
}

// Run if called directly
if (require.main === module) {
  fixMigrations().catch(error => {
    console.error('Failed to fix migrations:', error);
    process.exit(1);
  });
}

module.exports = { fixMigrations };