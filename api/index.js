module.exports = async (req, res) => {
  try {
    // Simple health check first
    if (req.url === "/health" || req.url === "/admin/health") {
      return res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV || "production",
          DATABASE_URL: process.env.DATABASE_URL ? "configured" : "missing",
          JWT_SECRET: process.env.JWT_SECRET ? "configured" : "missing",
          COOKIE_SECRET: process.env.COOKIE_SECRET ? "configured" : "missing",
          ADMIN_CORS: process.env.ADMIN_CORS || "not set",
          STORE_CORS: process.env.STORE_CORS || "not set",
          AUTH_CORS: process.env.AUTH_CORS || "not set"
        },
        headers: {
          host: req.headers.host,
          origin: req.headers.origin
        }
      });
    }

    // Root endpoint
    if (req.url === "/" || req.url === "") {
      return res.status(200).json({
        name: "Medusa API",
        version: "2.8.8",
        status: "running",
        endpoints: [
          "/health",
          "/admin/health",
          "/store",
          "/admin"
        ]
      });
    }

    // For now, return method not implemented for other routes
    return res.status(501).json({
      error: "Not Implemented",
      message: "This endpoint is not yet implemented",
      path: req.url,
      method: req.method
    });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message || "An unexpected error occurred",
      timestamp: new Date().toISOString()
    });
  }
};