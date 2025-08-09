// Railway environment check
const dns = require('dns');
const { promisify } = require('util');
const { testIPv4Connection } = require('./src/utils/database-config');
const lookup = promisify(dns.lookup);

// Force IPv4 first
dns.setDefaultResultOrder('ipv4first');

console.log('=== Railway Environment Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('PORT:', process.env.PORT);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);

async function checkDatabase() {
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      console.log('Database Host:', url.hostname);
      console.log('Database Port:', url.port || '5432');
      console.log('Database Name:', url.pathname.slice(1));
      console.log('PgBouncer:', url.searchParams.get('pgbouncer'));
      console.log('Connection Limit:', url.searchParams.get('connection_limit'));
      
      // Check DNS resolution
      try {
        const result = await lookup(url.hostname, { family: 4 });
        console.log('✅ IPv4 Resolution:', result.address);
      } catch (e) {
        console.log('❌ IPv4 Resolution failed:', e.message);
      }
      
      try {
        const result = await lookup(url.hostname, { family: 6 });
        console.log('⚠️  IPv6 Resolution:', result.address, '(will not be used)');
      } catch (e) {
        console.log('ℹ️  IPv6 Resolution not available (this is OK)');
      }
      
      // Test actual IPv4 connection
      console.log('\nTesting IPv4 connection to database...');
      const canConnect = await testIPv4Connection(url.hostname, parseInt(url.port || '6543'));
      if (canConnect) {
        console.log('✅ IPv4 connection test passed!');
      } else {
        console.log('⚠️  IPv4 connection test failed - will retry during startup');
      }
    } catch (e) {
      console.log('Invalid DATABASE_URL format:', e.message);
    }
  } else {
    console.log('ERROR: DATABASE_URL not set!');
    console.log('Available env vars:', Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY') && !k.includes('PASSWORD')).join(', '));
  }
  console.log('================================');
}

checkDatabase().catch(console.error);