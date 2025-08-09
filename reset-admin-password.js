#!/usr/bin/env node

/**
 * Reset admin password directly in the database
 */

const bcrypt = require('bcryptjs');

async function resetPassword() {
  console.log('🔐 Password Reset Tool\n');
  console.log('=====================================\n');
  
  // The new password you want to set
  const NEW_PASSWORD = 'Admin123!';  // Change this to your desired password
  const EMAIL = 'admin@dohhh.shop';  // Change this to your admin email if different
  
  console.log('📧 Resetting password for:', EMAIL);
  console.log('🔑 New password will be:', NEW_PASSWORD);
  console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');
  
  // Generate new password hash
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);
  
  console.log('✅ New password hash generated:');
  console.log(hashedPassword);
  
  console.log('\n📝 SQL Update Command:');
  console.log('=====================================\n');
  
  const sqlCommand = `UPDATE "user" SET password_hash = '${hashedPassword}' WHERE email = '${EMAIL}';`;
  
  console.log(sqlCommand);
  
  console.log('\n📋 Instructions:');
  console.log('=====================================\n');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Open the SQL editor');
  console.log('3. Run the SQL command above');
  console.log('4. Use the new password to login at admin.dohhh.shop');
  
  console.log('\n🔄 Alternative: Direct Database Update');
  console.log('=====================================\n');
  
  // Try to update directly if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    console.log('Attempting direct database update...\n');
    
    try {
      const { Client } = require('pg');
      
      // Parse and fix DATABASE_URL for SSL
      const databaseUrl = process.env.DATABASE_URL;
      const url = new URL(databaseUrl);
      
      // Force SSL settings for Supabase
      url.searchParams.set('sslmode', 'require');
      
      const client = new Client({
        connectionString: url.toString()
      });
      
      await client.connect();
      console.log('✅ Connected to database');
      
      // Update the password
      const result = await client.query(
        'UPDATE "user" SET password_hash = $1 WHERE email = $2',
        [hashedPassword, EMAIL]
      );
      
      if (result.rowCount > 0) {
        console.log('✅ Password updated successfully!');
        console.log(`   Updated ${result.rowCount} user(s)`);
        console.log('\n🎉 You can now login with:');
        console.log(`   Email: ${EMAIL}`);
        console.log(`   Password: ${NEW_PASSWORD}`);
      } else {
        console.log('⚠️  No user found with email:', EMAIL);
        console.log('   Please check the email address and try again');
      }
      
      await client.end();
      
    } catch (error) {
      console.log('❌ Direct database update failed:', error.message);
      console.log('\n📝 Please use the SQL command above in Supabase dashboard instead');
    }
  } else {
    console.log('DATABASE_URL not set. Please use the SQL command above in Supabase dashboard.');
  }
  
  console.log('\n=====================================');
  console.log('✅ Password reset process complete!');
  console.log('=====================================\n');
}

// Run if called directly
if (require.main === module) {
  resetPassword().catch(error => {
    console.error('Failed to reset password:', error);
    process.exit(1);
  });
}

module.exports = { resetPassword };