import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Manual auth implementation since Medusa v2 auth is broken
// This is a TEMPORARY workaround
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { actor_type, provider } = req.params
  
  // Only handle user emailpass for now
  if (actor_type !== "user" || provider !== "emailpass") {
    return res.status(404).json({ 
      message: "Not found" 
    })
  }
  
  const { email, password } = req.body as { email: string; password: string }
  
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password required"
    })
  }
  
  try {
    // Simple hardcoded check for our admin user
    // In production, this should properly validate against the database
    if (email === "admin@dohhh.shop" && password === "Admin123!") {
      // Create a session
      const sessionData = {
        user_id: "usr_da1f5903000d6b8506b426e2",
        email: "admin@dohhh.shop"
      }
      
      // Set a session cookie
      res.cookie("medusa_session_id", Buffer.from(JSON.stringify(sessionData)).toString('base64'), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/"
      })
      
      return res.json({
        user: {
          id: "usr_da1f5903000d6b8506b426e2",
          email: "admin@dohhh.shop"
        }
      })
    }
    
    return res.status(401).json({
      message: "Invalid credentials"
    })
    
  } catch (error) {
    console.error("Auth error:", error)
    return res.status(500).json({
      message: "Authentication failed"
    })
  }
}