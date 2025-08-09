// Railway environment check
const dns = require('dns');
const { promisify } = require('util');
const lookup = promisify(dns.lookup);

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
      
      // Check DNS resolution
      try {
        const result = await lookup(url.hostname, { family: 4 });
        console.log('IPv4 Resolution:', result.address);
      } catch (e) {
        console.log('IPv4 Resolution failed:', e.message);
      }
      
      try {
        const result = await lookup(url.hostname, { family: 6 });
        console.log('IPv6 Resolution:', result.address);
      } catch (e) {
        console.log('IPv6 Resolution failed:', e.message);
      }
    } catch (e) {
      console.log('Invalid DATABASE_URL format:', e.message);
    }
  } else {
    console.log('ERROR: DATABASE_URL not set!');
    console.log('Available env vars:', Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY')).join(', '));
  }
  console.log('================================');
}

checkDatabase().catch(console.error);