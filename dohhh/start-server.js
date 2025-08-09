#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if admin build exists
const adminPath = path.join(process.cwd(), '.medusa/server/public/admin/index.html');
const backupPath = path.join(process.cwd(), 'admin-backup/index.html');

console.log('Checking for admin build at:', adminPath);

if (!fs.existsSync(adminPath)) {
  console.log('❌ Admin build not found at expected location');
  
  // Try to restore from backup
  if (fs.existsSync(backupPath)) {
    console.log('✅ Found admin backup, restoring...');
    const { spawn } = require('child_process');
    const restore = spawn('node', ['preserve-admin.js'], { stdio: 'inherit' });
    restore.on('exit', () => {
      console.log('Admin restore attempt complete');
    });
  } else {
    console.log('❌ No admin backup found');
  }
}

if (fs.existsSync(adminPath)) {
  console.log('✅ Admin build is available');
  const adminDir = path.dirname(adminPath);
  const files = fs.readdirSync(adminDir);
  console.log('Admin directory contains:', files);
}

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

// If admin build exists but server can't find it, temporarily disable admin
if (!fs.existsSync(adminPath)) {
  console.log('⚠️  Admin build not accessible, disabling admin UI temporarily');
  process.env.DISABLE_ADMIN = 'true';
}

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