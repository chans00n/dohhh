#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if admin build exists
const adminPath = path.join(process.cwd(), '.medusa/server/public/admin/index.html');
console.log('Checking for admin build at:', adminPath);

if (fs.existsSync(adminPath)) {
  console.log('✅ Admin build found!');
  
  // List admin directory contents
  const adminDir = path.dirname(adminPath);
  const files = fs.readdirSync(adminDir);
  console.log('Admin directory contains:', files);
} else {
  console.log('❌ Admin build not found!');
  console.log('Current directory:', process.cwd());
  console.log('Directory contents:', fs.readdirSync(process.cwd()));
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