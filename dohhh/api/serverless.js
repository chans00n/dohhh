const { createMedusaApp } = require("@medusajs/framework");
const express = require("express");

let medusaApp;
let isInitializing = false;

async function loadApp() {
  if (medusaApp) {
    return medusaApp;
  }

  if (isInitializing) {
    // Wait for initialization to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
    return loadApp();
  }

  isInitializing = true;

  try {
    console.log("Initializing Medusa app...");
    
    const app = express();
    
    // Create Medusa app
    const { runApp } = await createMedusaApp({
      expressApp: app,
      projectConfigPath: process.cwd(),
    });

    await runApp();
    
    medusaApp = app;
    isInitializing = false;
    
    console.log("Medusa app initialized successfully");
    return medusaApp;
  } catch (error) {
    console.error("Failed to initialize Medusa app:", error);
    isInitializing = false;
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    const app = await loadApp();
    return app(req, res);
  } catch (error) {
    console.error("Serverless function error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};