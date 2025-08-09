import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FUNDRAISING_MODULE } from "../../../../../modules/fundraising"

// GET /store/campaigns/:id/contributions - recent backers/contributions (public-safe)
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const fundraisingModule = req.scope.resolve(FUNDRAISING_MODULE) as any
  const { id } = req.params
  const limit = Math.min(parseInt((req.query.limit as string) || "12"), 50)
  const since = (req.query.since as string) || "" // ISO date string

  try {
    const contributions = await fundraisingModule.listFundraisingContributions({
      campaign_id: id,
      status: "completed",
    } as any)

    let filtered = contributions
    if (since) {
      const sinceDate = new Date(since)
      if (!isNaN(sinceDate.getTime())) {
        filtered = contributions.filter((c: any) => new Date(c.created_at).getTime() >= sinceDate.getTime())
      }
    }

    const sorted = [...filtered].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const recent = sorted.slice(0, limit)

    const backers = recent.map((c: any) => ({
      id: c.id,
      name: c.contributor_name || "",
      anonymous: Boolean(c.is_anonymous),
      amount: typeof c.amount === "string" ? parseInt(c.amount) : Number(c.amount || 0),
      cookies_purchased: c.cookies_purchased || 0,
      created_at: c.created_at,
    }))

    res.json({ backers })
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching recent backers",
      error: error.message,
    })
  }
}

