import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { FUNDRAISING_MODULE } from "../../../../modules/fundraising"

// GET /store/campaigns/active - Get current active campaign
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const fundraisingModuleService = req.scope.resolve(FUNDRAISING_MODULE) as any
  
  try {
    const activeCampaign = await fundraisingModuleService.getActiveCampaign()
    
    if (!activeCampaign) {
      return res.status(404).json({
        message: "No active campaign found"
      })
    }

    res.json({
      campaign: activeCampaign
    })
  } catch (error) {
    res.status(500).json({
      message: "Error fetching active campaign",
      error: error.message
    })
  }
}