const { Client } = require('pg');

async function testConnection() {
  // Try the connection string from the error message
  const connectionString = 'postgresql://postgres:B00bies0980!@db.whycrwrascteduazhmyu.supabase.co:5432/postgres?sslmode=require';
  
  const client = new Client({
    connectionString,
  });

  try {
    console.log('Attempting to connect to database...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Current time from database:', result.rows[0].now);
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    
    // Try alternative connection format
    console.log('\nTrying alternative connection format...');
    const client2 = new Client({
      host: 'db.whycrwrascteduazhmyu.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'B00bies0980!',
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await client2.connect();
      console.log('✅ Alternative connection successful!');
      await client2.end();
    } catch (error2) {
      console.error('❌ Alternative connection also failed:', error2.message);
    }
  }
}

testConnection();