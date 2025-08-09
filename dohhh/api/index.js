const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

let app;
let isInitializing = false;

async function getApp() {
  if (app) return app;
  
  if (isInitializing) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return getApp();
  }
  
  isInitializing = true;
  
  try {
    console.log("Initializing Medusa server...");
    
    const expressApp = express();
    
    // Basic middleware
    expressApp.use(express.json());
    expressApp.use(express.urlencoded({ extended: true }));
    
    // CORS
    expressApp.use((req, res, next) => {
      const origin = req.headers.origin;
      const allowedOrigins = [
        process.env.STORE_CORS,
        process.env.ADMIN_CORS,
        process.env.AUTH_CORS
      ].join(",").split(",").filter(Boolean);
      
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
    
    // Health check
    expressApp.get("/admin/health", (req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV || "production",
          DATABASE_URL: process.env.DATABASE_URL ? "configured" : "missing",
          CORS: {
            ADMIN: process.env.ADMIN_CORS || "not set",
            STORE: process.env.STORE_CORS || "not set"
          }
        }
      });
    });
    
    // Load API routes
    try {
      const adminHealthRoute = require("../src/api/admin/health/route");
      expressApp.get("/admin/health/check", adminHealthRoute.GET);
    } catch (e) {
      console.log("Admin health route not found");
    }
    
    // Root
    expressApp.get("/", (req, res) => {
      res.json({
        name: "Medusa Server",
        version: "2.8.8",
        status: "running",
        endpoints: [
          "/admin/health",
          "/store",
          "/admin"
        ]
      });
    });
    
    // Admin app route
    expressApp.get("/app", (req, res) => {
      res.redirect("https://app.medusajs.com");
    });
    
    app = expressApp;
    isInitializing = false;
    
    return app;
  } catch (error) {
    console.error("Failed to initialize:", error);
    isInitializing = false;
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    const medusaApp = await getApp();
    return medusaApp(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};