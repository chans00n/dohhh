const dns = require('dns');
const { promisify } = require('util');
const lookup = promisify(dns.lookup);

// Force IPv4 globally for all DNS lookups
dns.setDefaultResultOrder('ipv4first');

// Override the default DNS lookup to force IPv4
const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  // Handle different function signatures
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  // Force IPv4
  if (typeof options === 'object' && options !== null) {
    options.family = 4;
  } else {
    options = { family: 4 };
  }
  
  return originalLookup.call(this, hostname, options, callback);
};

async function getIPv4Address(hostname) {
  try {
    const result = await lookup(hostname, { family: 4 });
    return result.address;
  } catch (error) {
    console.error('Failed to resolve IPv4 address:', error);
    return null;
  }
}

async function fixDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set!');
    return;
  }
  
  try {
    const url = new URL(process.env.DATABASE_URL);
    
    // If it's a Supabase URL, get the IPv4 address
    if (url.hostname.includes('supabase.co')) {
      console.log('Original hostname:', url.hostname);
      
      // Get IPv4 address
      const ipv4 = await getIPv4Address(url.hostname);
      
      if (ipv4) {
        console.log('Resolved IPv4 address:', ipv4);
        
        // Update the URL to use the IPv4 address directly
        url.hostname = ipv4;
        
        // Ensure we're using the session pooler port
        if (!url.port || url.port === '5432') {
          url.port = '6543';
        }
        
        // Ensure pgbouncer and SSL settings
        url.searchParams.set('pgbouncer', 'true');
        url.searchParams.set('sslmode', 'require');
        url.searchParams.set('connect_timeout', '10');
        url.searchParams.set('connection_limit', '1');
        
        // Add the host parameter to verify SSL certificate with the original hostname
        url.searchParams.set('host', 'db.whycrwrascteduazhmyu.supabase.co');
        
        const newUrl = url.toString();
        process.env.DATABASE_URL = newUrl;
        
        console.log('Updated DATABASE_URL to use IPv4 directly');
        console.log('New URL (masked):', newUrl.replace(/\/\/[^:]+:[^@]+@/, '//[CREDENTIALS]@'));
      } else {
        console.error('Could not resolve IPv4 address, keeping original URL');
      }
    }
  } catch (error) {
    console.error('Error processing DATABASE_URL:', error);
  }
}

module.exports = { fixDatabaseUrl, getIPv4Address };

// If run directly, fix the URL
if (require.main === module) {
  fixDatabaseUrl().then(() => {
    console.log('Database URL fix completed');
  }).catch(console.error);
}