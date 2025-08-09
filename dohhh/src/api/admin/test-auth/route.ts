import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // This endpoint tests if the admin authentication is working
  const authContext = (req as any).auth || (req as any).auth_context || (req as any).user
  
  res.json({
    message: "Admin API is accessible",
    authenticated: !!authContext,
    actor_id: authContext?.actor_id || authContext?.id || null,
    timestamp: new Date().toISOString()
  })
}