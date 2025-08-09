import { model } from "@medusajs/framework/utils"
import { FundraisingCampaign } from "./campaign"

export const FundraisingStats = model.define("fundraising_stats", {
  id: model.id().primaryKey(),
  total_raised: model.number().default(0), // in cents
  total_cookies_sold: model.number().default(0),
  total_backers: model.number().default(0),
  average_contribution: model.number().default(0),
  last_updated: model.dateTime(),
  campaign: model.belongsTo(() => FundraisingCampaign, {
    mappedBy: "stats",
  }),
})