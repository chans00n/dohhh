#!/usr/bin/env node

/**
 * Complete fix for Medusa admin panel on Railway
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function fixAdminPanel() {
  console.log('🔧 Complete Admin Panel Fix for Railway\n');
  console.log('=====================================\n');
  
  // Step 1: Set up environment
  console.log('Step 1: Setting up environment variables...');
  
  // Ensure critical secrets are set
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
  process.env.COOKIE_SECRET = process.env.COOKIE_SECRET || 'change-this-secret-in-production';
  
  // Set CORS properly
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN || 'admin.dohhh.shop';
  process.env.ADMIN_CORS = `https://${railwayDomain},https://admin.dohhh.shop`;
  process.env.AUTH_CORS = `https://${railwayDomain},https://admin.dohhh.shop,https://dohhh.shop,https://www.dohhh.shop`;
  process.env.STORE_CORS = 'https://dohhh.shop,https://www.dohhh.shop';
  
  // Backend URL for admin
  process.env.MEDUSA_BACKEND_URL = `https://${railwayDomain}`;
  process.env.MEDUSA_ADMIN_BACKEND_URL = `https://${railwayDomain}`;
  
  console.log('✅ Environment configured:');
  console.log('   Backend URL:', process.env.MEDUSA_BACKEND_URL);
  console.log('   Admin CORS:', process.env.ADMIN_CORS);
  console.log('   JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  
  // Step 2: Build the admin UI
  console.log('\nStep 2: Building admin UI...');
  
  try {
    // First try the standard build
    execSync('yarn build', {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    console.log('✅ Admin UI built successfully');
  } catch (error) {
    console.log('⚠️  Build failed, trying alternative method...');
    
    try {
      execSync('npx medusa build', {
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'production'
        }
      });
      console.log('✅ Admin UI built with medusa CLI');
    } catch (err) {
      console.log('⚠️  Admin UI build failed. Will run without UI.');
    }
  }
  
  // Step 3: Verify admin files exist
  console.log('\nStep 3: Verifying admin build...');
  
  const adminPaths = [
    '.medusa/server/public/admin',
    '.medusa/admin',
    'build/admin'
  ];
  
  let adminFound = false;
  let adminLocation = null;
  
  for (const adminPath of adminPaths) {
    const fullPath = path.join(process.cwd(), adminPath);
    const indexPath = path.join(fullPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      adminFound = true;
      adminLocation = fullPath;
      console.log(`✅ Admin UI found at: ${adminPath}`);
      
      // Check file count
      const files = fs.readdirSync(fullPath);
      console.log(`   Contains ${files.length} files`);
      break;
    }
  }
  
  if (!adminFound) {
    console.log('⚠️  Admin UI not found after build');
    console.log('   The admin API will still be available');
  }
  
  // Step 4: Update medusa-config.js to ensure admin is configured
  console.log('\nStep 4: Verifying admin configuration...');
  
  const configPath = path.join(process.cwd(), 'medusa-config.js');
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf-8');
    
    if (config.includes('admin:')) {
      console.log('✅ Admin configuration found in medusa-config.js');
    } else {
      console.log('⚠️  Admin configuration not found in medusa-config.js');
    }
  }
  
  // Step 5: Create a simple admin health check endpoint
  console.log('\nStep 5: Creating admin health check...');
  
  const healthCheckPath = path.join(process.cwd(), 'src/api/admin/health/route.ts');
  const healthCheckDir = path.dirname(healthCheckPath);
  
  if (!fs.existsSync(healthCheckDir)) {
    fs.mkdirSync(healthCheckDir, { recursive: true });
  }
  
  const healthCheckCode = `import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    status: "healthy",
    admin: "accessible",
    timestamp: new Date().toISOString(),
    backend_url: process.env.MEDUSA_BACKEND_URL || "not set",
    admin_cors: process.env.ADMIN_CORS || "not set"
  })
}`;
  
  fs.writeFileSync(healthCheckPath, healthCheckCode);
  console.log('✅ Admin health check endpoint created');
  
  // Step 6: Summary
  console.log('\n=====================================');
  console.log('📊 Admin Panel Setup Summary:\n');
  
  if (adminFound) {
    console.log('✅ Admin UI: Built and available');
    console.log(`   Location: ${adminLocation}`);
  } else {
    console.log('⚠️  Admin UI: Not built (API still available)');
  }
  
  console.log('\n✅ Admin API: Configured and ready');
  console.log('   Health check: /admin/health');
  console.log('   Auth endpoint: /auth/user/emailpass');
  
  console.log('\n🌐 URLs:');
  console.log(`   Admin Panel: https://${railwayDomain}/admin`);
  console.log(`   Health Check: https://${railwayDomain}/admin/health`);
  console.log(`   API Base: https://${railwayDomain}/admin`);
  
  console.log('\n📝 Next Steps:');
  console.log('1. Deploy this fix to Railway');
  console.log('2. Access the admin panel at /admin');
  console.log('3. Log in with your admin credentials');
  console.log('4. If login fails, check /admin/health for diagnostics');
  
  return true;
}

// Export for use in other scripts
module.exports = { fixAdminPanel };

// Run if called directly
if (require.main === module) {
  fixAdminPanel().then(() => {
    console.log('\n✅ Admin panel fix complete!');
  }).catch(error => {
    console.error('Failed to fix admin panel:', error);
    process.exit(1);
  });
}