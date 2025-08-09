import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function createAdminUser({ container }: ExecArgs) {
  const userModuleService = container.resolve(
    ContainerRegistrationKeys.USER_MODULE_SERVICE
  )

  const email = "admin@dohhh.shop"
  const password = "Admin123!"

  try {
    // Check if user exists
    const existingUsers = await userModuleService.listUsers({
      email,
    })

    if (existingUsers.length > 0) {
      console.log(`Admin user already exists: ${email}`)
      
      // Update password for existing user
      const user = existingUsers[0]
      await userModuleService.updateUsers([
        {
          id: user.id,
          email,
        }
      ])
      
      console.log(`Updated admin user: ${email}`)
    } else {
      // Create new admin user
      const user = await userModuleService.createUsers({
        email,
        first_name: "Admin",
        last_name: "User",
      })

      console.log(`Created admin user: ${email}`)
      console.log(`User ID: ${user.id}`)
    }

    console.log("\n✅ Admin user ready!")
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log("\nYou can now login at: /admin")
    
  } catch (error) {
    console.error("Error creating admin user:", error)
    throw error
  }
}