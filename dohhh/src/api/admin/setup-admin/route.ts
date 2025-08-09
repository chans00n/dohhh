import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// POST /admin/setup-admin - One-time admin user creation
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // IMPORTANT: Remove this endpoint after creating your admin user!
  
  try {
    const userModule = req.scope.resolve(Modules.USER)
    const authModule = req.scope.resolve(Modules.AUTH)
    
    const email = "admin@dohhh.shop"
    const password = req.body.password
    
    if (!password || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      })
    }
    
    // Create the user
    const user = await userModule.createUsers({
      email,
      first_name: "Admin",
      last_name: "User",
    })
    
    // Create auth identity
    await authModule.createAuthIdentities({
      provider_identities: [{
        entity_id: user.id,
        provider: "emailpass"
      }]
    })
    
    // Set password
    await authModule.updateAuthIdentities({
      id: user.id,
      provider_metadata: {
        password
      }
    })
    
    res.json({
      message: "Admin user created successfully!",
      email,
      next_steps: "1. Delete this file immediately! 2. Login at /app"
    })
  } catch (error) {
    console.error("Error creating admin user:", error)
    res.status(500).json({
      message: "Error creating admin user",
      error: error.message
    })
  }
}