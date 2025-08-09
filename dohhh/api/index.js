// Load environment variables
require("dotenv").config();

const express = require("express");
const { MedusaAppLoader, configLoader, logger } = require("@medusajs/framework");
const loaders = require("@medusajs/medusa/dist/loaders").default;

let app;
let isLoading = false;

async function loadApp() {
  if (app) return app;
  if (isLoading) {
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 100));
    return loadApp();
  }

  isLoading = true;

  try {
    console.log("Loading Medusa app...");
    
    const expressApp = express();
    const directory = process.cwd();
    
    // Load config
    const { configModule } = configLoader(directory);
    
    // Initialize Medusa
    const { container } = await loaders({
      directory,
      expressApp,
      isTest: false,
    });
    
    app = expressApp;
    isLoading = false;
    
    console.log("Medusa app loaded successfully");
    return app;
  } catch (error) {
    console.error("Failed to load Medusa app:", error);
    isLoading = false;
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    const medusaApp = await loadApp();
    return medusaApp(req, res);
  } catch (error) {
    console.error("Serverless function error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};