import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FUNDRAISING_MODULE } from "../../../modules/fundraising"
import { authenticate } from "@medusajs/framework/http"

// GET /admin/campaigns - List all campaigns
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // Authentication handled by middleware
  const fundraisingModuleService = req.scope.resolve(FUNDRAISING_MODULE)

  try {
    const [campaigns, count] = await fundraisingModuleService.listAndCountFundraisingCampaigns(
      {},
      {
        relations: ["stats"],
        order: { created_at: "DESC" },
      }
    )

    res.json({
      campaigns,
      count,
    })
  } catch (error) {
    res.status(500).json({
      message: "Error fetching campaigns",
      error: error.message
    })
  }
}

// POST /admin/campaigns - Create campaign
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // Authentication handled by middleware
  const fundraisingModuleService = req.scope.resolve(FUNDRAISING_MODULE)

  try {
    const campaign = await fundraisingModuleService.createCampaignWithStats(req.body)

    res.status(201).json({
      campaign
    })
  } catch (error) {
    res.status(500).json({
      message: "Error creating campaign",
      error: error.message
    })
  }
}

export const config = {
  middlewares: [authenticate("admin", "bearer")]
}