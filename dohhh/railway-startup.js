#!/usr/bin/env node

const { spawn } = require('child_process');
const { fixSupabaseConnection } = require('./supabase-fix');

async function startup() {
  console.log('🚀 Railway Startup Sequence\n');
  
  // Step 1: Fix database connection
  console.log('Step 1: Configuring database connection...');
  const dbFixed = await fixSupabaseConnection();
  if (!dbFixed) {
    console.error('Failed to configure database connection');
    process.exit(1);
  }
  
  // Step 2: Build Medusa (including admin UI)
  console.log('\nStep 2: Building Medusa application...');
  await new Promise((resolve, reject) => {
    const build = spawn('yarn', ['build'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    build.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Build completed successfully');
        resolve();
      } else {
        console.error('❌ Build failed with exit code:', code);
        reject(new Error('Build failed'));
      }
    });
  });
  
  // Step 2b: Fix and build admin panel completely
  console.log('\nStep 2b: Fixing admin panel...');
  const { fixAdminPanel } = require('./railway-admin-fix');
  try {
    await fixAdminPanel();
    console.log('✅ Admin panel setup complete');
  } catch (error) {
    console.log('⚠️  Admin panel setup failed, continuing with API only');
  }
  
  // Step 2c: Check build output
  console.log('\nStep 2c: Checking build output...');
  await new Promise((resolve) => {
    const check = spawn('node', ['check-build.js'], {
      stdio: 'inherit'
    });
    check.on('exit', () => resolve());
  });
  
  // Step 2d: Preserve admin build
  console.log('\nStep 2d: Preserving admin build...');
  await new Promise((resolve) => {
    const preserve = spawn('node', ['preserve-admin.js'], {
      stdio: 'inherit'
    });
    preserve.on('exit', () => resolve());
  });
  
  // Step 3: Setup admin user (optional, don't fail if it doesn't work)
  console.log('\nStep 3: Setting up admin user...');
  try {
    await new Promise((resolve) => {
      const setup = spawn('node', ['setup-admin-production.js'], {
        stdio: 'inherit',
        env: process.env
      });
      setup.on('exit', () => resolve());
      // Timeout after 30 seconds
      setTimeout(resolve, 30000);
    });
  } catch (error) {
    console.log('⚠️  Admin setup skipped');
  }
  
  // Step 4: Start the server
  console.log('\nStep 4: Starting Medusa server...\n');
  const server = spawn('node', ['start-server.js'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  server.on('exit', (code) => {
    console.log('Server exited with code:', code);
    process.exit(code);
  });
}

// Handle errors gracefully
startup().catch(error => {
  console.error('Startup failed:', error);
  process.exit(1);
});