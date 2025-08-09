"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { cache } from "react"

export const getActiveCampaign = cache(async () => {
  return sdk.client
    .fetch(`/store/campaigns/active`, {
      method: "GET",
      next: {
        revalidate: 60, // Revalidate every minute
      },
    })
    .then(({ campaign }) => campaign)
    .catch((err) => {
      console.error("Error fetching active campaign:", err)
      return null
    })
})

export const getCampaign = cache(async (id: string) => {
  return sdk.client
    .fetch(`/store/campaigns/${id}`, {
      method: "GET",
      next: {
        revalidate: 60,
      },
    })
    .then(({ campaign }) => campaign)
    .catch((err) => medusaError(err))
})

export const getCampaignStats = cache(async (id: string) => {
  return sdk.client
    .fetch(`/store/campaigns/${id}/stats`, {
      method: "GET",
      next: {
        revalidate: 30, // Revalidate every 30 seconds for more real-time updates
      },
    })
    .then(({ stats }) => stats)
    .catch((err) => medusaError(err))
})

export const getRecentBackers = cache(async (id: string, limit = 12, since?: string) => {
  return sdk.client
    .fetch(`/store/campaigns/${id}/contributions?limit=${limit}${since ? `&since=${encodeURIComponent(since)}` : ""}`, {
      method: "GET",
      next: {
        revalidate: 30,
      },
    })
    .then(({ backers }) => backers)
    .catch((err) => {
      console.error("Error fetching recent backers:", err)
      return []
    })
})