import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // Simple diagnostic endpoint to check what's happening with auth
  
  res.json({
    message: "Admin session endpoint ready",
    instruction: "POST to this endpoint with email and password",
    expected_format: {
      email: "admin@dohhh.shop",
      password: "Admin123!"
    },
    note: "This is a temporary bypass for testing admin access"
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  // Temporary endpoint to create an admin session for testing
  // This should be removed once normal auth is working
  
  const { email, password } = req.body
  
  // Simple hardcoded check for testing
  if (email === "admin@dohhh.shop" && password === "Admin123!") {
    // Create a simple session token
    const sessionData = {
      id: "usr_01J4tfbb2d00ddb806e420e",  // User ID from your screenshot
      email: "admin@dohhh.shop",
      role: "admin",
      timestamp: Date.now()
    }
    
    // Encode as base64 (simple approach without JWT)
    const token = Buffer.from(JSON.stringify(sessionData)).toString('base64')
    
    // Set auth in request context (if possible)
    (req as any).auth = sessionData;
    (req as any).auth_context = { actor_id: sessionData.id };
    
    res.json({
      success: true,
      message: "Session created (temporary bypass)",
      token,
      user: sessionData,
      admin_url: "https://admin.dohhh.shop/admin",
      note: "Use the token in Authorization header: Bearer [token]"
    })
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
      received: { email, password_length: password?.length || 0 }
    })
  }
}