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
  
  // Step 2b: Check build output
  console.log('\nStep 2b: Checking build output...');
  await new Promise((resolve) => {
    const check = spawn('node', ['check-build.js'], {
      stdio: 'inherit'
    });
    check.on('exit', () => resolve());
  });
  
  // Step 3: Start the server
  console.log('\nStep 3: Starting Medusa server...\n');
  const server = spawn('yarn', ['start'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NODE_OPTIONS: '--dns-result-order=ipv4first'
    }
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