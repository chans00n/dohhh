import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // Public endpoint to check admin configuration
  res.json({
    message: "Admin configuration info",
    admin_path: "/admin",
    admin_enabled: process.env.DISABLE_ADMIN !== 'true',
    backend_url: process.env.MEDUSA_BACKEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "not configured",
    admin_cors: process.env.ADMIN_CORS || "not set",
    auth_cors: process.env.AUTH_CORS || "not set",
    login_endpoint: "/auth/user/emailpass",
    create_user_endpoint: "/auth/user/emailpass/register",
    environment: process.env.NODE_ENV,
    note: "To access admin panel, you need to authenticate first at /auth/user/emailpass"
  })
}