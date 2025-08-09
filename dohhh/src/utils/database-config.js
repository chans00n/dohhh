const dns = require('dns');
const net = require('net');

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
        // IMPORTANT: Ensure we're using the session pooler port
        if (!url.port || url.port === '5432') {
          console.log('WARNING: Database URL is using direct connection port 5432, switching to pooler port 6543');
          url.port = '6543';
        }
        
        // Keep existing pgbouncer settings if they exist
        if (!url.searchParams.has('pgbouncer')) {
          url.searchParams.set('pgbouncer', 'true');
        }
        
        // Ensure SSL is required
        if (!url.searchParams.has('sslmode')) {
          url.searchParams.set('sslmode', 'require');
        }
        
        // Add connection timeout if not present
        if (!url.searchParams.has('connect_timeout')) {
          url.searchParams.set('connect_timeout', '10');
        }
        
        // Keep connection limit if specified
        if (!url.searchParams.has('connection_limit')) {
          url.searchParams.set('connection_limit', '1');
        }
        
        databaseUrl = url.toString();
        process.env.DATABASE_URL = databaseUrl;
        
        console.log('Database configured for Railway with IPv4 preferences');
        console.log('Using Supabase pooler on port:', url.port);
        console.log('PgBouncer enabled:', url.searchParams.get('pgbouncer'));
        console.log('Connection limit:', url.searchParams.get('connection_limit'));
      }
    } catch (e) {
      console.error('Error configuring database URL:', e);
    }
  }
  
  return databaseUrl;
}

// Helper to check if we can connect using IPv4
async function testIPv4Connection(hostname, port = 6543) {
  return new Promise((resolve) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err) {
        console.log('IPv4 lookup failed:', err.message);
        resolve(false);
      } else {
        console.log('IPv4 address resolved:', address);
        const socket = net.createConnection({ host: address, port, family: 4 }, () => {
          console.log('IPv4 connection test successful');
          socket.end();
          resolve(true);
        });
        
        socket.on('error', (err) => {
          console.log('IPv4 connection test failed:', err.message);
          resolve(false);
        });
        
        socket.setTimeout(5000, () => {
          console.log('IPv4 connection test timed out');
          socket.destroy();
          resolve(false);
        });
      }
    });
  });
}

module.exports = { configureDatabaseConnection, testIPv4Connection };