import { model } from "@medusajs/framework/utils"

const FundraisingContribution = model.define("fundraising_contribution", {
  id: model.id().primaryKey(),
  order_id: model.text(), // Reference to Medusa order
  customer_id: model.text().nullable(), // Reference to Medusa customer
  amount: model.text(), // Amount in cents as string to handle large numbers
  cookies_purchased: model.number().default(0),
  contributor_name: model.text().nullable(),
  contributor_email: model.text().nullable(),
  is_anonymous: model.boolean().default(false),
  message: model.text().nullable(),
  status: model.enum(["pending", "completed", "refunded"]).default("pending"),
  campaign: model.belongsTo(() => FundraisingCampaign, {
    mappedBy: "contributions",
  }),
})

export default FundraisingContribution

// Import campaign model after defining the contribution model to handle circular dependency
import { FundraisingCampaign } from "./campaign"