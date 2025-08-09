import { ExecArgs } from "@medusajs/framework/types"
import { FUNDRAISING_MODULE } from "../modules/fundraising"

export default async function exportData({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const queryRunner = container.resolve("query")
  const fundraisingModuleService = container.resolve(FUNDRAISING_MODULE) as any

  logger.info("Exporting existing data...")

  try {
    // Export products
    const { data: products } = await queryRunner.graph({
      entity: "product",
      fields: ["*", "variants.*", "categories.*"],
      filters: {}
    })
    
    console.log("\n=== PRODUCTS ===")
    console.log(JSON.stringify(products, null, 2))
    
    // Export campaigns
    const campaigns = await fundraisingModuleService.listCampaigns({}, {
      relations: ["contributions", "backers", "updates"]
    })
    
    console.log("\n=== CAMPAIGNS ===")
    console.log(JSON.stringify(campaigns, null, 2))
    
    // Export regions
    const { data: regions } = await queryRunner.graph({
      entity: "region",
      fields: ["*"],
      filters: {}
    })
    
    console.log("\n=== REGIONS ===")
    console.log(JSON.stringify(regions, null, 2))
    
    // Export categories
    const { data: categories } = await queryRunner.graph({
      entity: "product_category",
      fields: ["*"],
      filters: {}
    })
    
    console.log("\n=== CATEGORIES ===")
    console.log(JSON.stringify(categories, null, 2))
    
    logger.info("Data export completed!")
  } catch (error) {
    logger.error("Error exporting data:", error)
    throw error
  }
}