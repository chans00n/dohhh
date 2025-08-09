const path = require("path");

// Cache the server instance
let serverInstance;

module.exports = async (req, res) => {
  try {
    if (!serverInstance) {
      // Change to project root
      const projectRoot = path.join(__dirname, "..");
      process.chdir(projectRoot);
      
      // Set environment
      process.env.NODE_ENV = process.env.NODE_ENV || "production";
      process.env.MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "https://api.dohhh.shop";
      
      // Load environment variables
      if (!process.env.DATABASE_URL) {
        require("dotenv").config({ path: path.join(projectRoot, ".env") });
      }
      
      console.log("Initializing Medusa server for Vercel...");
      
      // Import the main server file
      const mainPath = path.join(projectRoot, ".medusa", "server", "src", "main.js");
      
      try {
        // Try to load the built server
        serverInstance = require(mainPath);
      } catch (err) {
        console.log("Built server not found, using development mode...");
        
        // Fall back to development server
        const express = require("express");
        const app = express();
        
        // CORS middleware
        app.use((req, res, next) => {
          const origin = req.headers.origin;
          const allowedOrigins = (process.env.ADMIN_CORS || "").split(",");
          
          if (allowedOrigins.includes(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
          }
          
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
          res.setHeader("Access-Control-Allow-Credentials", "true");
          
          if (req.method === "OPTIONS") {
            return res.sendStatus(200);
          }
          
          next();
        });
        
        // Basic routes
        app.use(express.json());
        
        app.get("/", (req, res) => {
          res.json({ message: "Medusa server is starting..." });
        });
        
        app.get("/admin/health", (req, res) => {
          res.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            mode: "fallback"
          });
        });
        
        serverInstance = app;
      }
    }
    
    // Handle the request
    if (typeof serverInstance === "function") {
      return serverInstance(req, res);
    } else if (serverInstance.app) {
      return serverInstance.app(req, res);
    } else if (serverInstance.handler) {
      return serverInstance.handler(req, res);
    } else {
      throw new Error("Invalid server instance");
    }
  } catch (error) {
    console.error("Vercel serverless error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      path: req.url,
      timestamp: new Date().toISOString()
    });
  }
};