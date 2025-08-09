#!/usr/bin/env node

/**
 * Build the Medusa admin UI
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function buildAdmin() {
  console.log('🔨 Building Medusa Admin UI...\n');
  
  // Ensure environment is set
  process.env.NODE_ENV = 'production';
  
  // Set the backend URL for the admin UI
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    process.env.MEDUSA_BACKEND_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    process.env.MEDUSA_ADMIN_BACKEND_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  } else {
    process.env.MEDUSA_BACKEND_URL = 'https://admin.dohhh.shop';
    process.env.MEDUSA_ADMIN_BACKEND_URL = 'https://admin.dohhh.shop';
  }
  
  console.log('Backend URL:', process.env.MEDUSA_BACKEND_URL);
  
  // Try different build commands
  const buildCommands = [
    ['yarn', ['build:admin']],
    ['npx', ['medusa', 'build']],
    ['yarn', ['build']]
  ];
  
  let buildSuccess = false;
  
  for (const [command, args] of buildCommands) {
    console.log(`\nTrying: ${command} ${args.join(' ')}`);
    
    try {
      await new Promise((resolve, reject) => {
        const build = spawn(command, args, {
          stdio: 'inherit',
          env: {
            ...process.env,
            NODE_ENV: 'production'
          }
        });
        
        build.on('exit', (code) => {
          if (code === 0) {
            console.log(`✅ Build command succeeded: ${command} ${args.join(' ')}`);
            buildSuccess = true;
            resolve();
          } else {
            console.log(`⚠️  Build command failed: ${command} ${args.join(' ')}`);
            reject(new Error(`Build failed with code ${code}`));
          }
        });
      });
      
      if (buildSuccess) break;
    } catch (error) {
      console.log(`⚠️  Continuing to next build method...`);
    }
  }
  
  // Check if admin was built
  const possiblePaths = [
    '.medusa/server/public/admin',
    '.medusa/admin',
    'build/admin',
    'dist/admin',
    'admin'
  ];
  
  let adminPath = null;
  
  for (const checkPath of possiblePaths) {
    const fullPath = path.join(process.cwd(), checkPath, 'index.html');
    if (fs.existsSync(fullPath)) {
      adminPath = path.dirname(fullPath);
      console.log(`\n✅ Found admin UI at: ${adminPath}`);
      break;
    }
  }
  
  if (!adminPath) {
    console.log('\n❌ Admin UI build not found after build attempts');
    console.log('   The admin panel may need to be built manually');
    return false;
  }
  
  // List contents
  const files = fs.readdirSync(adminPath);
  console.log(`   Contains ${files.length} files:`, files.slice(0, 5).join(', '), '...');
  
  // Ensure it's in the expected location
  const expectedPath = path.join(process.cwd(), '.medusa/server/public/admin');
  if (adminPath !== expectedPath) {
    console.log(`\n📦 Moving admin UI to expected location...`);
    
    // Create directory structure
    const expectedDir = path.dirname(expectedPath);
    if (!fs.existsSync(expectedDir)) {
      fs.mkdirSync(expectedDir, { recursive: true });
    }
    
    // Copy files
    const copyRecursive = (src, dest) => {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          copyRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    
    copyRecursive(adminPath, expectedPath);
    console.log(`✅ Admin UI copied to: ${expectedPath}`);
  }
  
  return true;
}

// Export for use in other scripts
module.exports = { buildAdmin };

// Run if called directly
if (require.main === module) {
  buildAdmin().then(success => {
    if (success) {
      console.log('\n✅ Admin UI build complete!');
      console.log('   The admin panel should be available at /admin');
    } else {
      console.log('\n⚠️  Admin UI build incomplete');
      process.exit(1);
    }
  }).catch(error => {
    console.error('Failed to build admin:', error);
    process.exit(1);
  });
}