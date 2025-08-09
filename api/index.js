const path = require("path");
const express = require("express");

// Set up environment
const MEDUSA_DIR = path.join(__dirname, "../dohhh");
process.chdir(MEDUSA_DIR);

// Load production environment variables
require("dotenv").config({ path: path.join(MEDUSA_DIR, ".env.production") });

let app;
let isInitializing = false;
let initializationError = null;

async function getMedusaApp() {
  // Return cached app if available
  if (app) return app;
  
  // Return error if initialization failed
  if (initializationError) throw initializationError;
  
  // Wait if already initializing
  if (isInitializing) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (app) {
          clearInterval(checkInterval);
          resolve(app);
        } else if (initializationError) {
          clearInterval(checkInterval);
          reject(initializationError);
        }
      }, 100);
    });
  }
  
  // Start initialization
  isInitializing = true;
  
  try {
    console.log("Initializing Medusa for Vercel...");
    console.log("Database URL:", process.env.DATABASE_URL ? "Set" : "Not set");
    console.log("Working directory:", process.cwd());
    
    // Create Express app
    const expressApp = express();
    
    // Load Medusa using the loaders
    const loaders = require("@medusajs/medusa/dist/loaders").default;
    const expressLoader = require("@medusajs/medusa/dist/loaders/express").default;
    const configModule = require(path.join(MEDUSA_DIR, "medusa-config"));
    
    // Initialize container with all services
    const container = await loaders({
      directory: MEDUSA_DIR,
      expressApp,
      isTest: false,
    });
    
    // Load express server
    await expressLoader({ app: expressApp, configModule });
    
    app = expressApp;
    console.log("Medusa initialized successfully");
    
    return app;
  } catch (error) {
    console.error("Failed to initialize Medusa:", error);
    initializationError = error;
    throw error;
  } finally {
    isInitializing = false;
  }
}

// Export handler
module.exports = async (req, res) => {
  try {
    const medusaApp = await getMedusaApp();
    return medusaApp(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({
      error: "Server Error",
      message: error.message,
      path: req.path
    });
  }
};