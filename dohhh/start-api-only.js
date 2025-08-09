#!/usr/bin/env node

/**
 * Start Medusa API without Admin UI
 * This bypasses the admin build check to get the backend running
 */

const { spawn } = require('child_process');

console.log('🚀 Starting Medusa Backend API (Admin UI disabled)\n');

// Set environment to disable admin
process.env.NODE_ENV = 'production';
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';
process.env.DISABLE_ADMIN = 'true';

console.log('Configuration:');
console.log('- Admin UI: DISABLED');
console.log('- API Port:', process.env.PORT || 9000);
console.log('- Environment: production\n');

// Start the server with admin disabled
const server = spawn('yarn', ['start'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DISABLE_ADMIN: 'true'
  }
});

server.on('exit', (code) => {
  console.log('Server exited with code:', code);
  process.exit(code);
});

console.log('Backend API starting...');
console.log('Once running, the API will be available at:');
console.log(`- Railway URL: https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'your-app.railway.app'}`);
console.log('- API endpoints: /store/* and /admin/*');
console.log('\nNote: Admin UI is disabled. Use API directly or deploy admin separately.');