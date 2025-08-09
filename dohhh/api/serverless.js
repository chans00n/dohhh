const path = require("path");

let medusaApp;

async function loadApp() {
  if (medusaApp) {
    return medusaApp;
  }

  try {
    // Set up the correct directory
    const appDir = path.join(__dirname, "..");
    process.chdir(appDir);

    // Load the built Medusa app
    const medusaPath = path.join(appDir, ".medusa", "server", "index.js");
    const { app } = require(medusaPath);
    
    medusaApp = app;
    return medusaApp;
  } catch (error) {
    console.error("Failed to load Medusa app:", error);
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
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};