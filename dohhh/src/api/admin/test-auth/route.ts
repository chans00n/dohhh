import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // This endpoint tests if the admin authentication is working
  res.json({
    message: "Admin API is accessible",
    authenticated: !!req.auth_context?.actor_id,
    actor_id: req.auth_context?.actor_id || null,
    timestamp: new Date().toISOString()
  })
}