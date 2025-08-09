import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FUNDRAISING_MODULE } from "../../../../modules/fundraising"

// GET /store/campaigns/test - Test basic campaign query
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const fundraisingModuleService = req.scope.resolve(FUNDRAISING_MODULE)
  
  try {
    // Simple list without any filters or relations
    const campaigns = await fundraisingModuleService.listFundraisingCampaigns()
    
    res.json({
      count: campaigns.length,
      campaigns: campaigns.map(c => ({
        id: c.id,
        title: c.title,
        status: c.status,
        goal_amount: c.goal_amount,
      }))
    })
  } catch (error) {
    res.status(500).json({
      message: "Error listing campaigns",
      error: error.message
    })
  }
}