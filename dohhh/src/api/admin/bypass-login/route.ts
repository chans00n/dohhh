import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// TEMPORARY: Remove this file once proper auth is working
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = req.body as { email?: string; password?: string }
  
  // Simple bypass for testing
  if (body.email === "admin@dohhh.shop" && body.password === "Admin123!") {
    // Set a simple cookie that we can check
    res.cookie("medusa_admin_bypass", "usr_da1f5903000d6b8506b426e2", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    
    res.json({
      success: true,
      message: "Bypass login successful",
      user: {
        id: "usr_da1f5903000d6b8506b426e2",
        email: "admin@dohhh.shop"
      },
      note: "This is a temporary bypass. Access admin at /admin"
    })
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid credentials"
    })
  }
}