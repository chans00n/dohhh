import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // Basic health check
    const response = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? "configured" : "missing",
        ADMIN_CORS: process.env.ADMIN_CORS ? "configured" : "missing",
        STORE_CORS: process.env.STORE_CORS ? "configured" : "missing",
      }
    }

    // Try to check database connection
    try {
      const dbModule = req.scope.resolve("__pg_connection__")
      if (dbModule) {
        response["database"] = "connected"
      }
    } catch (dbError) {
      response["database"] = "error"
      response["dbError"] = dbError.message
    }

    res.json(response)
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    })
  }
}