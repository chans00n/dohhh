import { 
  defineMiddlewares,
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction
} from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/*",
      middlewares: [
        async (
          req: MedusaRequest,
          res: MedusaResponse,
          next: MedusaNextFunction
        ) => {
          // Allow CORS for admin routes
          const allowedOrigins = [
            "https://admin.dohhh.shop",
            "http://localhost:8888",
            "http://localhost:8000",
            "http://localhost:3000",
            "http://127.0.0.1:8888"
          ]
          
          const origin = req.headers.origin
          if (origin && allowedOrigins.includes(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin)
            res.setHeader("Access-Control-Allow-Credentials", "true")
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
          }
          
          // Handle preflight
          if (req.method === "OPTIONS") {
            return res.status(200).end()
          }
          
          next()
        },
      ],
    },
    {
      matcher: "/auth/*",
      middlewares: [
        async (
          req: MedusaRequest,
          res: MedusaResponse,
          next: MedusaNextFunction
        ) => {
          // Allow CORS for auth routes
          const allowedOrigins = [
            "https://admin.dohhh.shop",
            "https://dohhh.shop",
            "https://www.dohhh.shop",
            "http://localhost:8888",
            "http://localhost:8000",
            "http://localhost:3000",
            "http://127.0.0.1:8888"
          ]
          
          const origin = req.headers.origin
          if (origin && allowedOrigins.includes(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin)
            res.setHeader("Access-Control-Allow-Credentials", "true")
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
          }
          
          // Handle preflight
          if (req.method === "OPTIONS") {
            return res.status(200).end()
          }
          
          next()
        },
      ],
    },
  ],
})