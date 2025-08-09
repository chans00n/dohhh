#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { fixAdminAuth } = require('./fix-admin-auth');

// Fix admin authentication setup
console.log('🔧 Configuring admin authentication...\n');
fixAdminAuth();

// Check if admin build exists
const adminPath = path.join(process.cwd(), '.medusa/server/public/admin/index.html');
const backupPath = path.join(process.cwd(), 'admin-backup/index.html');

console.log('\nChecking for admin build at:', adminPath);

if (!fs.existsSync(adminPath)) {
  console.log('⚠️  Admin UI not found at expected location');
  
  // Try to restore from backup
  if (fs.existsSync(backupPath)) {
    console.log('✅ Found admin backup, restoring...');
    const { spawn } = require('child_process');
    const restore = spawn('node', ['preserve-admin.js'], { stdio: 'inherit' });
    restore.on('exit', () => {
      console.log('Admin restore attempt complete');
    });
  } else {
    console.log('ℹ️  Admin UI not built. The admin API will still work.');
    console.log('   You can use the admin API directly or build the UI with yarn build:admin');
  }
}

if (fs.existsSync(adminPath)) {
  console.log('✅ Admin UI build is available');
  const adminDir = path.dirname(adminPath);
  const files = fs.readdirSync(adminDir);
  console.log('   Admin directory contains:', files.length, 'files');
}

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

// Ensure JWT and Cookie secrets are set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-secret-change-in-production';
  console.log('⚠️  Using default JWT_SECRET - CHANGE THIS IN PRODUCTION!');
}

if (!process.env.COOKIE_SECRET) {
  process.env.COOKIE_SECRET = process.env.COOKIE_SECRET || 'your-super-secret-cookie-secret-change-in-production';
  console.log('⚠️  Using default COOKIE_SECRET - CHANGE THIS IN PRODUCTION!');
}

// Don't disable admin - let it run even without UI
// The API endpoints will still work for authentication
console.log('\n✅ Admin panel enabled at /admin');
console.log('   JWT_SECRET is set:', !!process.env.JWT_SECRET);
console.log('   COOKIE_SECRET is set:', !!process.env.COOKIE_SECRET);

// Start Medusa
console.log('\nStarting Medusa server...\n');

const server = spawn('yarn', ['start'], {
  stdio: 'inherit',
  env: {
    ...process.env
  },
  cwd: process.cwd()
});

server.on('exit', (code) => {
  console.log('Server exited with code:', code);
  process.exit(code);
});