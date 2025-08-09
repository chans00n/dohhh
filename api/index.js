const path = require("path");
const express = require("express");

// Set the Medusa directory
const MEDUSA_DIR = path.join(__dirname, "../dohhh");

// Change to Medusa directory
process.chdir(MEDUSA_DIR);

// Create a cached app instance
let app;

async function createApp() {
  if (app) return app;
  
  try {
    console.log("Creating Medusa app for Vercel...");
    
    // Create Express app
    const expressApp = express();
    
    // Import Medusa's loaders
    const loaders = require(path.join(MEDUSA_DIR, "node_modules/@medusajs/medusa/dist/loaders")).default;
    
    // Load Medusa
    await loaders({
      directory: MEDUSA_DIR,
      expressApp,
      isTest: false
    });
    
    app = expressApp;
    console.log("Medusa app created successfully");
    
    return app;
  } catch (error) {
    console.error("Failed to create Medusa app:", error);
    throw error;
  }
}

// Export the handler
module.exports = async (req, res) => {
  try {
    const medusaApp = await createApp();
    return medusaApp(req, res);
  } catch (error) {
    console.error("Request handler error:", error);
    
    // If initialization fails, return a meaningful error
    res.status(500).json({
      error: "Server initialization failed",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};