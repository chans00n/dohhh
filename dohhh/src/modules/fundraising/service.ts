import { MedusaService } from "@medusajs/framework/utils"
import { FundraisingCampaign, FundraisingMilestone, FundraisingUpdate, FundraisingStats, FundraisingContribution } from "./models"

class FundraisingModuleService extends MedusaService({
  FundraisingCampaign,
  FundraisingMilestone,
  FundraisingUpdate,
  FundraisingStats,
  FundraisingContribution,
}) {
  // Custom methods

  async createCampaignWithStats(data: any) {
    const campaign = await this.createFundraisingCampaigns(data)
    
    // Create associated stats record
    await this.createFundraisingStats({
      campaign_id: campaign.id,
      total_raised: 0,
      total_cookies_sold: 0,
      total_backers: 0,
    })

    return campaign
  }

  async getActiveCampaign() {
    const now = new Date()
    const campaigns = await this.listFundraisingCampaigns({
      status: "active",
      start_date: { $lte: now },
      end_date: { $gte: now },
    })

    return campaigns[0] || null
  }

  async updateCampaignStats(campaignId: string, updates: {
    incrementRaised?: number,
    incrementCookies?: number,
    incrementBackers?: number,
  }) {
    const stats = await this.listFundraisingStats({
      where: { campaign_id: campaignId }
    })

    if (!stats || stats.length === 0) {
      return null
    }

    const currentStats = stats[0]
    const updateData: any = {
      last_calculated_at: new Date(),
      updated_at: new Date(),
    }

    if (updates.incrementRaised) {
      updateData.total_raised = currentStats.total_raised + updates.incrementRaised
    }
    if (updates.incrementCookies) {
      updateData.total_cookies_sold = currentStats.total_cookies_sold + updates.incrementCookies
    }
    if (updates.incrementBackers) {
      updateData.total_backers = currentStats.total_backers + updates.incrementBackers
    }

    return await this.updateFundraisingStats({
      id: currentStats.id,
      ...updateData
    })
  }

  async checkAndUpdateMilestones(campaignId: string) {
    const campaign = await this.retrieveFundraisingCampaign(campaignId, {
      relations: ["milestones", "stats"],
    }) as any

    if (!campaign || !campaign.stats || !campaign.milestones) {
      return
    }

    const totalRaised = campaign.stats.total_raised

    for (const milestone of campaign.milestones) {
      if (!milestone.reached_at && totalRaised >= milestone.target_amount) {
        await this.updateFundraisingMilestones({
          id: milestone.id,
          reached_at: new Date(),
        })
      }
    }
  }

  async getCampaignStats(campaignId: string) {
    const stats = await this.listFundraisingStats({
      where: { campaign_id: campaignId }
    })

    return stats?.[0] || null
  }
}

export default FundraisingModuleService