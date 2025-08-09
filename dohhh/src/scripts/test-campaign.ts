import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function testCampaign({ container }) {
  const fundraisingModuleService = container.resolve("fundraisingModuleService")
  
  console.log("Testing campaign module...")

  try {
    // List all campaigns
    const campaigns = await fundraisingModuleService.listFundraisingCampaigns()
    console.log(`Found ${campaigns.length} campaigns`)
    
    if (campaigns.length > 0) {
      console.log("\nCampaigns:")
      campaigns.forEach(campaign => {
        console.log(`- ${campaign.title} (${campaign.status})`)
      })
    }

    // Check for active campaign
    const activeCampaign = await fundraisingModuleService.getActiveCampaign()
    if (activeCampaign) {
      console.log("\nActive campaign found:")
      console.log(`- Title: ${activeCampaign.title}`)
      console.log(`- Status: ${activeCampaign.status}`)
      console.log(`- Goal: $${activeCampaign.goal_amount / 100}`)
    } else {
      console.log("\nNo active campaign found")
    }

  } catch (error) {
    console.error("Error testing campaign:", error)
  }
}