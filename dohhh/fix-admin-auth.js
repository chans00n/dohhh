#!/usr/bin/env node

/**
 * Fix admin authentication and serving issues on Railway
 */

const fs = require('fs');
const path = require('path');

function fixAdminAuth() {
  console.log('🔧 Fixing admin authentication setup...\n');
  
  // Ensure environment variables are set correctly
  if (!process.env.JWT_SECRET) {
    console.log('⚠️  JWT_SECRET not set, using default (CHANGE THIS IN PRODUCTION!)');
    process.env.JWT_SECRET = 'supersecret-change-this-in-production';
  }
  
  if (!process.env.COOKIE_SECRET) {
    console.log('⚠️  COOKIE_SECRET not set, using default (CHANGE THIS IN PRODUCTION!)');
    process.env.COOKIE_SECRET = 'supersecret-change-this-in-production';
  }
  
  // Set correct CORS for admin
  const adminDomain = 'https://admin.dohhh.shop';
  process.env.ADMIN_CORS = adminDomain;
  process.env.AUTH_CORS = `${adminDomain},https://dohhh.shop,https://www.dohhh.shop`;
  
  // Set the backend URL correctly for Railway
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    process.env.MEDUSA_BACKEND_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    console.log('✅ Backend URL set to:', process.env.MEDUSA_BACKEND_URL);
  }
  
  // Ensure admin is enabled
  delete process.env.DISABLE_ADMIN;
  
  console.log('✅ Admin authentication environment configured');
  console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  console.log('   COOKIE_SECRET:', process.env.COOKIE_SECRET ? 'Set' : 'Not set');
  console.log('   ADMIN_CORS:', process.env.ADMIN_CORS);
  console.log('   AUTH_CORS:', process.env.AUTH_CORS);
  console.log('   Backend URL:', process.env.MEDUSA_BACKEND_URL || 'Not set');
  
  // Check if we need to build admin UI
  const adminPath = path.join(process.cwd(), '.medusa/server/public/admin');
  const adminIndexPath = path.join(adminPath, 'index.html');
  
  if (!fs.existsSync(adminIndexPath)) {
    console.log('\n⚠️  Admin UI not built. Run yarn build:admin to build it.');
    console.log('   The admin API endpoints will still work for authentication.');
  } else {
    console.log('\n✅ Admin UI found at:', adminPath);
  }
  
  return true;
}

// Export for use in other scripts
module.exports = { fixAdminAuth };

// Run if called directly
if (require.main === module) {
  fixAdminAuth();
}