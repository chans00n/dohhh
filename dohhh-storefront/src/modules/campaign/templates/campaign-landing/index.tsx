import React from "react"
import CampaignHero from "../../components/campaign-hero"
// Secondary progress tracker removed per request
import BackingTiers from "../../components/backing-tiers"
import CampaignStory from "../../components/campaign-story"
import SocialProof from "../../components/social-proof"
import StickySupportBar from "../../components/sticky-support-bar"
import { Product } from "@medusajs/types"

interface CampaignLandingTemplateProps {
  campaign: any
  products: Product[]
  recentBackers?: any[]
  testimonials?: any[]
}

const CampaignLandingTemplate: React.FC<CampaignLandingTemplateProps> = ({
  campaign,
  products,
  recentBackers = [],
  testimonials = [],
}) => {
  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg-base dark:bg-dark-bg-base">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-light-text-base dark:text-dark-text-base mb-4">
            No Active Campaign
          </h1>
          <p className="text-light-text-muted dark:text-dark-text-muted">
            Check back soon for our next fundraising campaign!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-bg-base dark:bg-dark-bg-base">
      {/* Hero Section */}
      <CampaignHero campaign={campaign} stats={campaign.stats} />
      
      {/* Secondary progress tracker removed */}
      
      {/* Backing Tiers */}
      <BackingTiers 
        products={products} 
        campaign={campaign} 
      />
      
      {/* Campaign Story */}
      <CampaignStory 
        campaign={campaign} 
        updates={campaign.updates} 
      />
      
      {/* Social Proof */}
      <SocialProof 
        campaign={campaign} 
        recentBackers={recentBackers} 
        testimonials={testimonials} 
      />

      {/* Sticky Support Bar */}
      <StickySupportBar campaign={campaign} stats={campaign.stats} />
    </div>
  )
}

export default CampaignLandingTemplate