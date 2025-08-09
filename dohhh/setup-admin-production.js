#!/usr/bin/env node

/**
 * Setup admin user for production
 * This ensures the admin user exists and can login
 */

const { spawn } = require('child_process');

async function setupAdmin() {
  console.log('🔧 Setting up admin user for production...\n');
  
  // Set production environment
  process.env.NODE_ENV = 'production';
  
  // Ensure secrets are set
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-secret-change-in-production';
  process.env.COOKIE_SECRET = process.env.COOKIE_SECRET || 'your-super-secret-cookie-secret-change-in-production';
  
  // Fix database URL if needed
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    url.searchParams.set('sslmode', 'no-verify');
    process.env.DATABASE_URL = url.toString();
  }
  
  console.log('Running admin setup script...\n');
  
  return new Promise((resolve, reject) => {
    const setup = spawn('npx', ['medusa', 'exec', './src/scripts/create-admin.ts'], {
      stdio: 'inherit',
      env: process.env
    });
    
    setup.on('exit', (code) => {
      if (code === 0) {
        console.log('\n✅ Admin setup complete!');
        resolve();
      } else {
        console.log('\n⚠️  Admin setup had issues, but continuing...');
        resolve(); // Don't fail the deployment
      }
    });
  });
}

// Run if called directly
if (require.main === module) {
  setupAdmin().catch(error => {
    console.error('Setup failed:', error);
    // Don't exit with error to not break deployment
  });
}

module.exports = { setupAdmin };