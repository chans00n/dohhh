const path = require("path");
const express = require("express");

// Set environment
process.env.NODE_ENV = "production";
const MEDUSA_DIR = path.join(__dirname, "../dohhh");

// Load environment variables
require("dotenv").config({ path: path.join(MEDUSA_DIR, ".env.production") });

// Simple health check for immediate response
if (!process.env.DATABASE_URL) {
  module.exports = (req, res) => {
    res.status(500).json({ error: "DATABASE_URL not configured" });
  };
  return;
}

// Create Express app
const app = express();

// Basic middleware
app.use(express.json());
app.use(require("cors")({
  origin: process.env.STORE_CORS?.split(",") || "*",
  credentials: true
}));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize Medusa
let medusaInitialized = false;
let initError = null;

async function initializeMedusa() {
  if (medusaInitialized || initError) return;
  
  try {
    console.log("Starting Medusa initialization...");
    
    // Change to Medusa directory
    process.chdir(MEDUSA_DIR);
    
    // Load Medusa
    const loaders = require("@medusajs/medusa/dist/loaders").default;
    await loaders({
      directory: MEDUSA_DIR,
      expressApp: app,
      isTest: false
    });
    
    medusaInitialized = true;
    console.log("Medusa initialized successfully");
  } catch (error) {
    console.error("Medusa initialization failed:", error);
    initError = error;
  }
}

// Start initialization immediately
initializeMedusa();

// Export handler
module.exports = async (req, res) => {
  // Quick health check
  if (req.path === "/health") {
    return res.json({ 
      status: medusaInitialized ? "ready" : "initializing",
      error: initError?.message 
    });
  }
  
  // Admin not supported in serverless
  if (req.path.startsWith("/app") || req.path.startsWith("/admin")) {
    return res.status(200).json({
      message: "Admin dashboard is not available in serverless deployment",
      info: "Use Medusa Admin locally or deploy to a traditional hosting platform"
    });
  }
  
  // Wait for initialization if needed
  if (!medusaInitialized && !initError) {
    const maxWait = 25000; // 25 seconds max
    const start = Date.now();
    
    while (!medusaInitialized && !initError && (Date.now() - start) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Check initialization status
  if (initError) {
    return res.status(500).json({
      error: "Server initialization failed",
      message: initError.message
    });
  }
  
  if (!medusaInitialized) {
    return res.status(503).json({
      error: "Server is still initializing",
      message: "Please try again in a few seconds"
    });
  }
  
  // Handle the request with Express app
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};