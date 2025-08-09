// Railway environment check
console.log('=== Railway Environment Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('PORT:', process.env.PORT);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);

if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('Database Host:', url.hostname);
    console.log('Database Port:', url.port);
    console.log('Database Name:', url.pathname.slice(1));
  } catch (e) {
    console.log('Invalid DATABASE_URL format');
  }
} else {
  console.log('ERROR: DATABASE_URL not set!');
  console.log('Available env vars:', Object.keys(process.env).filter(k => !k.includes('SECRET')).join(', '));
}
console.log('================================');