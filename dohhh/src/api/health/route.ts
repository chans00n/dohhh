import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    status: "healthy",
    service: "medusa-backend",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    railway: process.env.RAILWAY_ENVIRONMENT ? true : false
  })
}