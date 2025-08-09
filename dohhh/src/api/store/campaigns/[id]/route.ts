import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FUNDRAISING_MODULE } from "../../../../modules/fundraising"

// GET /store/campaigns/:id - Get campaign details
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const fundraisingModuleService = req.scope.resolve(FUNDRAISING_MODULE)
  const { id } = req.params

  try {
    const campaign = await fundraisingModuleService.retrieveFundraisingCampaign(id, {
      relations: ["milestones", "stats", "updates"],
    })

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found"
      })
    }

    res.json({
      campaign
    })
  } catch (error) {
    res.status(500).json({
      message: "Error fetching campaign",
      error: error.message
    })
  }
}