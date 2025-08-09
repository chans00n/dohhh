import { model } from "@medusajs/framework/utils"

export const FundraisingCampaign = model.define("fundraising_campaign", {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text(),
  story_content: model.text().nullable(),
  impact_content: model.text().nullable(),
  cause_name: model.text(),
  goal_amount: model.number(), // in cents
  goal_cookies: model.number(),
  start_date: model.dateTime(),
  end_date: model.dateTime(),
  status: model.enum(["draft", "active", "completed", "cancelled"]),
  featured_image_url: model.text().nullable(),
  video_url: model.text().nullable(),
  about_image_url: model.text().nullable(),
  organizer_name: model.text().nullable(),
  organizer_title: model.text().nullable(),
  organizer_bio: model.text().nullable(),
  organizer_image: model.text().nullable(),
  milestones: model.hasMany(() => FundraisingMilestone, {
    mappedBy: "campaign",
  }),
  stats: model.hasOne(() => FundraisingStats, {
    mappedBy: "campaign",
  }),
  updates: model.hasMany(() => FundraisingUpdate, {
    mappedBy: "campaign",
  }),
  contributions: model.hasMany(() => FundraisingContribution, {
    mappedBy: "campaign",
  }),
})

// Import these models at the top - circular dependency handled by lazy loading
import { FundraisingMilestone } from "./campaign-milestone"
import { FundraisingStats } from "./campaign-stats"
import { FundraisingUpdate } from "./campaign-update"
import FundraisingContribution from "./contribution"