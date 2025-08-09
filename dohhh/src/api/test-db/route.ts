import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // Test database connectivity
  try {
    const dbUrl = process.env.DATABASE_URL ? "configured" : "not configured"
    const nodeEnv = process.env.NODE_ENV || "not set"
    const jwtSecret = process.env.JWT_SECRET ? "set" : "not set"
    const cookieSecret = process.env.COOKIE_SECRET ? "set" : "not set"
    
    res.json({
      status: "ok",
      database: dbUrl,
      environment: nodeEnv,
      jwt_secret: jwtSecret,
      cookie_secret: cookieSecret,
      auth_endpoint: "/auth/user/emailpass",
      admin_endpoint: "/admin",
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message || "Unknown error",
      timestamp: new Date().toISOString()
    })
  }
}