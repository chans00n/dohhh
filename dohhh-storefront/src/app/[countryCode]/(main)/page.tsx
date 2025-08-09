import { Metadata } from "next"
import { notFound } from "next/navigation"

import CampaignLandingTemplate from "@modules/campaign/templates/campaign-landing"
import { getActiveCampaign, getCampaignStats, getRecentBackers } from "@lib/data/campaigns"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { listCollections } from "@lib/data/collections"

export const metadata: Metadata = {
  title: "DOHHH Cookies - Support a Great Cause",
  description:
    "Buy delicious cookies and support amazing causes. Every cookie purchase makes a difference.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)
  
  if (!region) {
    return notFound()
  }

  // Fetch active campaign
  const campaign = await getActiveCampaign()
  
  // If there's an active campaign, show the campaign landing page
  if (campaign) {
    // Fetch campaign stats
    const stats = await getCampaignStats(campaign.id)
    
    // Merge stats into campaign object
    const campaignWithStats = {
      ...campaign,
      stats
    }
    
    // Fetch cookie products
    const { response } = await listProducts({
      regionId: region.id,
      queryParams: {
        limit: 12,
        fields: "id,title,subtitle,handle,thumbnail,description,metadata,variants.id,variants.prices.*",
      }
    })
    
    // For now, show all products without filtering
    const products = response.products
    
    console.log("Total products:", products.length)
    products.forEach(p => {
      const price = p.variants?.[0]?.prices?.[0]?.amount || 0
      console.log(`- ${p.title}: $${price / 100} (${p.variants?.length || 0} variants)`)
    })
    
    // Recent backers (live)
    const recentBackers: any[] = await getRecentBackers(campaign.id, 12)
    const testimonials: any[] = []
    
    return (
      <CampaignLandingTemplate
        campaign={campaignWithStats}
        products={products}
        recentBackers={recentBackers}
        testimonials={testimonials}
      />
    )
  }
  
  // Fallback to original store layout if no active campaign
  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  // Import these dynamically to avoid issues when campaign is active
  const Hero = (await import("@modules/home/components/hero")).default
  const FeaturedProducts = (await import("@modules/home/components/featured-products")).default

  return (
    <>
      <Hero />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}
