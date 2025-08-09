import { model } from "@medusajs/framework/utils"
import { FundraisingCampaign } from "./campaign"

export const FundraisingUpdate = model.define("fundraising_update", {
  id: model.id().primaryKey(),
  title: model.text(),
  content: model.text(),
  campaign: model.belongsTo(() => FundraisingCampaign, {
    mappedBy: "updates",
  }),
})