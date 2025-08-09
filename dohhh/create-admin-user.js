#!/usr/bin/env node

/**
 * Create an admin user for Medusa
 * Run this script to create your first admin user
 */

const { spawn } = require('child_process');

async function createAdminUser() {
  console.log('🔧 Creating admin user for Medusa...\n');
  
  // Fix the DATABASE_URL for SSL if needed
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    url.searchParams.set('sslmode', 'no-verify');
    url.searchParams.set('pgbouncer', 'true');
    url.searchParams.set('connection_limit', '1');
    process.env.DATABASE_URL = url.toString();
    
    console.log('✅ Database URL configured');
  }
  
  // Admin user details
  const email = process.env.ADMIN_EMAIL || 'admin@dohhh.shop';
  const password = process.env.ADMIN_PASSWORD || 'supersecret';
  
  console.log('📧 Creating admin user with email:', email);
  console.log('🔑 Using password:', password.replace(/./g, '*'));
  console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');
  
  // Create the admin user using Medusa CLI
  await new Promise((resolve, reject) => {
    const createUser = spawn('npx', [
      'medusa',
      'user',
      '--email', email,
      '--password', password
    ], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    createUser.on('exit', (code) => {
      if (code === 0) {
        console.log('\n✅ Admin user created successfully!');
        console.log('\n📱 You can now log in at: https://admin.dohhh.shop/admin');
        console.log('   Email:', email);
        console.log('   Password:', password);
        resolve();
      } else {
        console.error('\n❌ Failed to create admin user');
        console.log('\nTrying alternative method...');
        // Try alternative method
        resolve();
      }
    });
  });
}

// Alternative method using direct database connection
async function createAdminUserDirect() {
  console.log('\n🔄 Trying direct database method...\n');
  
  try {
    const { Client } = require('pg');
    const bcrypt = require('bcryptjs');
    
    // Parse DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not set');
    }
    
    const url = new URL(databaseUrl);
    url.searchParams.set('sslmode', 'no-verify');
    
    const client = new Client({
      connectionString: url.toString()
    });
    
    await client.connect();
    console.log('✅ Connected to database');
    
    const email = process.env.ADMIN_EMAIL || 'admin@dohhh.shop';
    const password = process.env.ADMIN_PASSWORD || 'supersecret';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const checkUser = await client.query(
      'SELECT id FROM "user" WHERE email = $1',
      [email]
    );
    
    if (checkUser.rows.length > 0) {
      console.log('⚠️  User already exists with email:', email);
      console.log('   Updating password...');
      
      // Update existing user
      await client.query(
        'UPDATE "user" SET password_hash = $1 WHERE email = $2',
        [hashedPassword, email]
      );
      
      console.log('✅ Password updated for existing user');
    } else {
      // Create new user
      const userId = 'usr_' + Math.random().toString(36).substring(2, 15);
      
      await client.query(
        `INSERT INTO "user" (id, email, password_hash, role, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [userId, email, hashedPassword, 'admin']
      );
      
      console.log('✅ New admin user created');
    }
    
    await client.end();
    
    console.log('\n✅ Admin user ready!');
    console.log('\n📱 You can now log in at: https://admin.dohhh.shop/admin');
    console.log('   Email:', email);
    console.log('   Password:', password);
    
  } catch (error) {
    console.error('❌ Direct database method failed:', error.message);
    console.log('\n💡 Please create an admin user manually after deployment');
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser().then(() => {
    // If first method didn't work, try direct method
    if (process.env.TRY_DIRECT_METHOD === 'true') {
      return createAdminUserDirect();
    }
  }).catch(error => {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  });
}

module.exports = { createAdminUser, createAdminUserDirect };