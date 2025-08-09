import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FUNDRAISING_MODULE } from "../../../../../modules/fundraising"

// GET /store/campaigns/:id/stats - Get real-time campaign stats
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const fundraisingModuleService = req.scope.resolve(FUNDRAISING_MODULE) as any
  const { id } = req.params

  try {
    const campaign = await fundraisingModuleService.retrieveFundraisingCampaign(id, {
      relations: ["stats"],
    }) as any

    if (!campaign || !campaign.stats) {
      return res.status(404).json({
        message: "Campaign stats not found"
      })
    }

    // Calculate percentage progress
    const percentageAmount = campaign.stats.total_raised / campaign.goal_amount * 100
    const percentageCookies = campaign.stats.total_cookies_sold / campaign.goal_cookies * 100

    res.json({
      stats: {
        ...(campaign.stats || {}),
        percentage_amount: Math.min(percentageAmount, 100),
        percentage_cookies: Math.min(percentageCookies, 100),
        days_remaining: Math.max(0, Math.ceil((new Date(campaign.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      }
    })
  } catch (error) {
    res.status(500).json({
      message: "Error fetching campaign stats",
      error: error.message
    })
  }
}