import { model } from "@medusajs/framework/utils"
import { FundraisingCampaign } from "./campaign"

export const FundraisingMilestone = model.define("fundraising_milestone", {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text(),
  target_amount: model.number(),
  reached_at: model.dateTime().nullable(),
  order: model.number().default(0),
  campaign: model.belongsTo(() => FundraisingCampaign, {
    mappedBy: "milestones",
  }),
})