import { ExecArgs } from "@medusajs/framework/types"
import { FUNDRAISING_MODULE } from "../../modules/fundraising"

export default async function seedProductionData({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const fundraisingModuleService = container.resolve(FUNDRAISING_MODULE) as any

  logger.info("Starting production data seeding...")

  try {
    // Create a campaign if none exists
    const campaigns = await fundraisingModuleService.listCampaigns()
    
    if (campaigns.length === 0) {
      logger.info("Creating initial campaign...")
      
      const campaign = await fundraisingModuleService.createCampaign({
        name: "School Bake Sale Fundraiser",
        description: "Help us raise funds for new playground equipment by purchasing our delicious homemade cookies!",
        campaign_type: "flexible",
        goal_amount: 5000,
        currency_code: "usd",
        starts_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        ends_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        about_image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"
      })
      
      logger.info(`Created campaign: ${campaign.name}`)
      
      // Add a campaign update
      await fundraisingModuleService.createCampaignUpdate({
        campaign_id: campaign.id,
        title: "Great Progress!",
        content: "Thanks to all our supporters! We have reached 30% of our goal in just 5 days. Keep spreading the word!"
      })
      
      logger.info("Added campaign update")
    } else {
      logger.info(`Found ${campaigns.length} existing campaigns`)
    }
    
    logger.info("Production data seeding completed successfully!")
  } catch (error) {
    logger.error("Error seeding production data:", error)
    throw error
  }
}