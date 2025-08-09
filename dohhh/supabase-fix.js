#!/usr/bin/env node

/**
 * Supabase Connection Fix for Railway
 * 
 * This script handles the connection to Supabase from Railway by:
 * 1. Using the correct pooler endpoint
 * 2. Forcing IPv4 connections
 * 3. Providing fallback connection methods
 */

const dns = require('dns');
const { promisify } = require('util');

// Configure DNS to use public resolvers
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

async function fixSupabaseConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set!');
    return false;
  }

  try {
    const originalUrl = new URL(process.env.DATABASE_URL);
    console.log('Original Database URL:');
    console.log('  Host:', originalUrl.hostname);
    console.log('  Port:', originalUrl.port);
    
    // Check if this is a Supabase URL that needs fixing
    if (originalUrl.hostname.includes('supabase.co') && originalUrl.hostname.startsWith('db.')) {
      // This is the old direct connection format
      // We need to convert it to the pooler format
      console.log('  Converting to session pooler format...');
      
      // Extract the project ID
      const parts = originalUrl.hostname.split('.');
      const projectId = parts[1]; // whycrwrascteduazhmyu
      console.log('  Project ID:', projectId);
      
      // For your project, the correct pooler endpoint is aws-0-us-west-1.pooler.supabase.com
      const poolerEndpoint = 'aws-0-us-west-1.pooler.supabase.com';
      
      // Try to resolve the pooler endpoint to an IP address
      let resolvedIP = null;
      
      try {
        console.log(`\nResolving pooler endpoint: ${poolerEndpoint}`);
        const resolve4 = promisify(resolver.resolve4.bind(resolver));
        const addresses = await resolve4(poolerEndpoint);
        
        if (addresses && addresses.length > 0) {
          console.log(`✅ Successfully resolved to IP: ${addresses[0]}`);
          resolvedIP = addresses[0];
        }
      } catch (error) {
        console.log(`  Failed to resolve: ${error.message}`);
      }
      
      // Build the new connection URL
      const newUrl = new URL(process.env.DATABASE_URL);
      
      if (resolvedIP) {
        // Use the resolved IP for Railway (avoids DNS issues)
        newUrl.hostname = resolvedIP;
        console.log('  Using resolved IP address for connection');
      } else {
        // Fallback to the pooler hostname
        newUrl.hostname = poolerEndpoint;
        console.log('  Using pooler hostname directly');
      }
      
      // Update username format for pooler: postgres.{project-id}
      newUrl.username = `postgres.${projectId}`;
      
      // Use port 5432 for the pooler (not 6543)
      newUrl.port = '5432';
      
      // Ensure connection parameters
      newUrl.searchParams.set('pgbouncer', 'true');
      newUrl.searchParams.set('connection_limit', '1');
      // Use no-verify to bypass certificate validation while maintaining SSL encryption
      newUrl.searchParams.set('sslmode', 'no-verify');
      
      // If using IP, add the original host for SSL verification
      if (resolvedIP) {
        newUrl.searchParams.set('host', poolerEndpoint);
      }
      
      const updatedUrl = newUrl.toString();
      process.env.DATABASE_URL = updatedUrl;
      
      console.log('\n✅ Database URL updated to use session pooler:');
      console.log('  New Host:', newUrl.hostname);
      console.log('  New Username:', newUrl.username);
      console.log('  Port:', newUrl.port);
      console.log('  PgBouncer:', 'enabled');
      
      return true;
    } else if (originalUrl.hostname === 'aws-0-us-west-1.pooler.supabase.com') {
      // Already using the correct pooler endpoint
      console.log('✅ Already using session pooler endpoint');
      
      // Just ensure we have the right parameters
      originalUrl.searchParams.set('pgbouncer', 'true');
      originalUrl.searchParams.set('connection_limit', '1');
      // Use no-verify to bypass certificate validation while maintaining SSL encryption
      originalUrl.searchParams.set('sslmode', 'no-verify');
      
      process.env.DATABASE_URL = originalUrl.toString();
      return true;
    } else {
      // Not a Supabase URL that needs conversion
      console.log('  URL format does not require conversion');
      return true;
    }
  } catch (error) {
    console.error('Error processing DATABASE_URL:', error);
    return false;
  }
}

// Export for use in other modules
module.exports = { fixSupabaseConnection };

// If run directly, execute the fix
if (require.main === module) {
  fixSupabaseConnection().then(success => {
    if (success) {
      console.log('\n✅ Supabase connection fix completed successfully');
    } else {
      console.log('\n❌ Failed to fix Supabase connection');
      process.exit(1);
    }
  });
}