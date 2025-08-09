const { loadEnv, defineConfig } = require('@medusajs/framework/utils');

// Load environment variables
loadEnv(process.env.NODE_ENV || 'development', process.cwd());

// Railway provides DATABASE_URL directly, so use it if available
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL;

// Log for debugging (remove in production)
console.log('Environment:', process.env.NODE_ENV);
console.log('Database URL configured:', databaseUrl ? 'Yes' : 'No');
console.log('Database host:', databaseUrl ? new URL(databaseUrl).hostname : 'Not set');
console.log('Database port:', databaseUrl ? new URL(databaseUrl).port : 'Not set');

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: databaseUrl,
    http: {
      storeCors: process.env.STORE_CORS || "https://dohhh.shop,https://www.dohhh.shop",
      adminCors: process.env.ADMIN_CORS || "https://admin.dohhh.shop",
      authCors: process.env.AUTH_CORS || "https://dohhh.shop,https://www.dohhh.shop,https://admin.dohhh.shop",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              capture: true,
            }
          }
        ]
      }
    },
    {
      resolve: "./src/modules/fundraising",
    }
  ]
});