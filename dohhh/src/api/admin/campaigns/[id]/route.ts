import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FUNDRAISING_MODULE } from "../../../../modules/fundraising"
import { authenticate } from "@medusajs/framework/http"

// GET /admin/campaigns/:id - Get campaign details
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // Authentication handled by middleware
  const fundraisingModuleService = req.scope.resolve(FUNDRAISING_MODULE) as any
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

// PUT /admin/campaigns/:id - Update campaign
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // Authentication handled by middleware
  const fundraisingModuleService = req.scope.resolve(FUNDRAISING_MODULE) as any
  const { id } = req.params

  console.log(`[CAMPAIGN UPDATE] PUT - Updating campaign ${id} with data:`, req.body)

  try {
    // First retrieve the existing campaign
    const existingCampaign = await fundraisingModuleService.retrieveFundraisingCampaign(id)
    
    if (!existingCampaign) {
      return res.status(404).json({
        message: "Campaign not found"
      })
    }

    // Update the campaign
    const [campaign] = await fundraisingModuleService.updateFundraisingCampaigns([{
      id,
      ...(req.body || {})
    }])

    // Retrieve the campaign again to ensure we have the latest data
    const updatedCampaign = await fundraisingModuleService.retrieveFundraisingCampaign(id, {
      relations: ["milestones", "stats", "updates"],
    })

    res.json({
      campaign: updatedCampaign
    })
  } catch (error) {
    console.error(`[CAMPAIGN UPDATE] PUT - Error updating campaign:`, error)
    res.status(500).json({
      message: "Error updating campaign",
      error: error.message
    })
  }
}

// PATCH /admin/campaigns/:id - Update campaign (same as PUT)
export async function PATCH(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // Authentication handled by middleware
  const fundraisingModuleService = req.scope.resolve(FUNDRAISING_MODULE) as any
  const { id } = req.params

  console.log(`[CAMPAIGN UPDATE] Updating campaign ${id} with data:`, req.body)

  try {
    // First retrieve the existing campaign
    const existingCampaign = await fundraisingModuleService.retrieveFundraisingCampaign(id)
    
    if (!existingCampaign) {
      return res.status(404).json({
        message: "Campaign not found"
      })
    }

    console.log(`[CAMPAIGN UPDATE] Existing campaign goal_amount:`, existingCampaign.goal_amount)

    // Update the campaign
    const [campaign] = await fundraisingModuleService.updateFundraisingCampaigns([{
      id,
      ...(req.body || {})
    }])

    console.log(`[CAMPAIGN UPDATE] Campaign updated successfully:`, {
      id: campaign.id,
      goal_amount: campaign.goal_amount,
      title: campaign.title,
      body_goal: (req.body as any).goal_amount
    })

    // Retrieve the campaign again to ensure we have the latest data
    const updatedCampaign = await fundraisingModuleService.retrieveFundraisingCampaign(id, {
      relations: ["milestones", "stats", "updates"],
    })

    console.log(`[CAMPAIGN UPDATE] Retrieved updated campaign goal_amount:`, updatedCampaign.goal_amount)

    res.json({
      campaign: updatedCampaign
    })
  } catch (error) {
    console.error(`[CAMPAIGN UPDATE] Error updating campaign:`, error)
    res.status(500).json({
      message: "Error updating campaign",
      error: error.message
    })
  }
}

// DELETE /admin/campaigns/:id - Delete campaign
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // Authentication handled by middleware
  const fundraisingModuleService = req.scope.resolve(FUNDRAISING_MODULE) as any
  const { id } = req.params

  try {
    await fundraisingModuleService.deleteFundraisingCampaigns(id)

    res.status(204).send()
  } catch (error) {
    res.status(500).json({
      message: "Error deleting campaign",
      error: error.message
    })
  }
}

export const config = {
  middlewares: [authenticate("admin", "bearer")]
}