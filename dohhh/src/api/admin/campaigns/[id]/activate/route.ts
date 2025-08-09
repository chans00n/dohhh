import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FUNDRAISING_MODULE } from "../../../../../modules/fundraising"
import { authenticate } from "@medusajs/framework/http"

// POST /admin/campaigns/:id/activate - Activate campaign
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // Authentication handled by middleware
  const fundraisingModuleService = req.scope.resolve(FUNDRAISING_MODULE)
  const { id } = req.params

  try {
    // First deactivate any currently active campaigns
    const activeCampaign = await fundraisingModuleService.getActiveCampaign()
    if (activeCampaign && activeCampaign.id !== id) {
      await fundraisingModuleService.updateFundraisingCampaigns({
        id: activeCampaign.id,
        status: "completed"
      })
    }

    // Activate the requested campaign
    const campaign = await fundraisingModuleService.updateFundraisingCampaigns({
      id,
      status: "active",
      start_date: new Date(), // Update start date to now if activating
    })

    res.json({
      campaign
    })
  } catch (error) {
    res.status(500).json({
      message: "Error activating campaign",
      error: error.message
    })
  }
}

export const config = {
  middlewares: [authenticate("admin", "bearer")]
}