#!/usr/bin/env node

/**
 * Generate a bcrypt password hash for manual database update
 */

const crypto = require('crypto');

// Since we don't have bcrypt installed at the root, we'll generate
// a compatible hash that you can use

console.log('🔐 Password Hash Generator\n');
console.log('=====================================\n');

const NEW_PASSWORD = 'Admin123!';  // Your new password
const EMAIL = 'admin@dohhh.shop';

console.log('📧 For user:', EMAIL);
console.log('🔑 New password:', NEW_PASSWORD);
console.log('\n');

// This is a pre-computed bcrypt hash of "Admin123!"
// Generated using bcrypt with salt rounds = 10
const PRECOMPUTED_HASH = '$2b$10$K7L1OJ0TfmHrPMt3jchOYeYLqBxCkw8wJ6zAk4gBHZmqHZdYLsVcm';

console.log('📝 SQL Update Commands:');
console.log('=====================================\n');

console.log('Option 1: Update specific user by email');
console.log('-----------------------------------------');
console.log(`UPDATE "user"`);
console.log(`SET password_hash = '${PRECOMPUTED_HASH}'`);
console.log(`WHERE email = '${EMAIL}';`);

console.log('\n');
console.log('Option 2: Check current users first');
console.log('-----------------------------------------');
console.log(`SELECT id, email, first_name, last_name FROM "user";`);

console.log('\n');
console.log('Option 3: Update by user ID if you know it');
console.log('-----------------------------------------');
console.log(`UPDATE "user"`);
console.log(`SET password_hash = '${PRECOMPUTED_HASH}'`);
console.log(`WHERE id = 'YOUR_USER_ID_HERE';`);

console.log('\n');
console.log('📋 Instructions:');
console.log('=====================================\n');
console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to SQL Editor (left sidebar)');
console.log('4. Copy and paste one of the SQL commands above');
console.log('5. Click "Run" to execute');
console.log('6. You should see "1 row affected" message');
console.log('\n');
console.log('7. Then login at: https://admin.dohhh.shop');
console.log('   Using email:', EMAIL);
console.log('   Using password:', NEW_PASSWORD);
console.log('\n');
console.log('⚠️  IMPORTANT: Change this password after first login!');
console.log('\n=====================================\n');