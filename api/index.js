module.exports = async (req, res) => {
  try {
    // Set CORS headers
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://dohhh.shop",
      "https://www.dohhh.shop",
      "https://api.dohhh.shop",
      "http://localhost:8000",
      "http://localhost:9000"
    ];
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    // Handle OPTIONS request
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    
    // Health check endpoints
    if (req.url === "/health" || req.url === "/admin/health") {
      return res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV || "production",
          DATABASE_URL: process.env.DATABASE_URL ? "configured" : "missing",
          JWT_SECRET: process.env.JWT_SECRET ? "configured" : "missing",
          COOKIE_SECRET: process.env.COOKIE_SECRET ? "configured" : "missing",
          CORS: {
            ADMIN: process.env.ADMIN_CORS,
            STORE: process.env.STORE_CORS,
            AUTH: process.env.AUTH_CORS
          }
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
          "/admin/app",
          "/store",
          "/admin"
        ]
      });
    }
    
    // Admin app - serve HTML
    if (req.url === "/app" || req.url === "/admin" || req.url === "/admin/app") {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Medusa Admin</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: sans-serif;">
    <h1>Medusa Admin</h1>
    <p>The admin panel needs to be built and deployed separately.</p>
    <p>For now, you can:</p>
    <ul style="list-style: none; padding: 0;">
      <li>1. Run the admin locally with: <code>cd dohhh && yarn dev</code></li>
      <li>2. Access it at: <code>http://localhost:5173</code></li>
      <li>3. Or deploy the admin separately to Vercel/Netlify</li>
    </ul>
    <hr style="margin: 30px auto; width: 300px;">
    <p>API Status: ✅ Running</p>
    <p><a href="/health">Check API Health</a></p>
  </div>
</body>
</html>`;
      
      res.setHeader("Content-Type", "text/html");
      return res.status(200).send(html);
    }
    
    // Auth endpoints
    if (req.url.startsWith("/auth")) {
      // For now, return a placeholder
      return res.status(200).json({
        message: "Auth endpoint",
        path: req.url
      });
    }
    
    // Store endpoints
    if (req.url.startsWith("/store")) {
      // For now, return a placeholder
      return res.status(200).json({
        message: "Store endpoint",
        path: req.url
      });
    }
    
    // Admin endpoints
    if (req.url.startsWith("/admin")) {
      // For now, return a placeholder
      return res.status(200).json({
        message: "Admin endpoint",
        path: req.url
      });
    }
    
    // 404 for everything else
    return res.status(404).json({
      error: "Not Found",
      message: "The requested endpoint does not exist",
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