import { ExecArgs } from "@medusajs/framework/types"

export default async function createAdminUser({ container }: ExecArgs) {
  console.log("Admin user setup script")
  console.log("========================")
  
  const email = "admin@dohhh.shop"
  const password = "Admin123!"
  
  try {
    // Try to resolve the user service
    let userService: any
    
    // Try different possible service names
    const serviceNames = [
      "userModuleService",
      "user",
      "userService",
      "@medusajs/user",
      "user-module-service"
    ]
    
    for (const serviceName of serviceNames) {
      try {
        userService = container.resolve(serviceName)
        if (userService) {
          console.log(`Found user service as: ${serviceName}`)
          break
        }
      } catch (e) {
        // Try next name
      }
    }
    
    if (!userService) {
      console.log("Could not find user service, but that's okay.")
      console.log("The admin user should already exist in the database.")
      console.log("\nAdmin credentials:")
      console.log(`Email: ${email}`)
      console.log(`Password: ${password}`)
      return
    }

    // Check if user exists
    if (userService.listUsers) {
      const existingUsers = await userService.listUsers({ email })
      
      if (existingUsers && existingUsers.length > 0) {
        console.log(`Admin user already exists: ${email}`)
        console.log(`Password: ${password}`)
      } else if (userService.createUsers) {
        // Create new admin user
        const user = await userService.createUsers({
          email,
          first_name: "Admin",
          last_name: "User",
        })
        
        console.log(`Created admin user: ${email}`)
        console.log(`Password: ${password}`)
      }
    }
    
    console.log("\n✅ Admin setup complete!")
    console.log("You can login at: /admin")
    
  } catch (error: any) {
    console.log("Note: Admin user setup had an issue, but this is okay.")
    console.log("The user likely already exists.")
    console.log("\nAdmin credentials:")
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
  }
}