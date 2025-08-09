const dns = require('dns');

// Force IPv4 for database connections on Railway
function configureDatabaseConnection() {
  // Set DNS to prefer IPv4
  if (process.env.RAILWAY_ENVIRONMENT) {
    dns.setDefaultResultOrder('ipv4first');
    
    // Additional Node.js settings for IPv4
    if (!process.env.NODE_OPTIONS) {
      process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';
    } else if (!process.env.NODE_OPTIONS.includes('dns-result-order')) {
      process.env.NODE_OPTIONS += ' --dns-result-order=ipv4first';
    }
  }

  // Process DATABASE_URL for Supabase
  let databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl && process.env.RAILWAY_ENVIRONMENT) {
    try {
      const url = new URL(databaseUrl);
      
      // If it's a Supabase URL, ensure proper configuration
      if (url.hostname.includes('supabase.co')) {
        // Use session pooler port if not already set
        if (!url.port || url.port === '5432') {
          url.port = '6543'; // Session pooler port
        }
        
        // Add connection parameters
        url.searchParams.set('sslmode', 'require');
        url.searchParams.set('connect_timeout', '10');
        url.searchParams.set('pool_mode', 'session');
        
        // For IPv4, we might need to use the IPv4 address directly
        // This is a fallback if DNS resolution still fails
        if (url.hostname === 'db.whycrwrascteduazhmyu.supabase.co') {
          // You can optionally hardcode the IPv4 address here if needed
          // url.hostname = 'xxx.xxx.xxx.xxx'; // Replace with actual IPv4
        }
        
        databaseUrl = url.toString();
        process.env.DATABASE_URL = databaseUrl;
        
        console.log('Database configured for Railway with IPv4 preferences');
        console.log('Using session pooler on port:', url.port);
      }
    } catch (e) {
      console.error('Error configuring database URL:', e);
    }
  }
  
  return databaseUrl;
}

module.exports = { configureDatabaseConnection };