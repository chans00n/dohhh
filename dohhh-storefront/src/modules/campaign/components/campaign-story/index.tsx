"use client"

import React from "react"
import { cn } from "@lib/utils"
import { Button } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface CampaignStoryProps {
  campaign: any
  className?: string
}

const CampaignStory: React.FC<CampaignStoryProps> = ({ campaign, className }) => {
  if (!campaign) return null

  return (
    <section id="story" className={cn("py-12 md:py-20 bg-light-bg-hover dark:bg-dark-bg-hover", className)}>
      <div className="content-container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-light-text-base dark:text-dark-text-base mb-6">
          About {campaign.title}
          </h2>
          {campaign.video_url ? (
            <div className="mb-6 rounded-lg overflow-hidden bg-light-bg-base dark:bg-dark-bg-base">
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                  src={campaign.video_url}
                  title="Campaign Video"
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : campaign.about_image_url ? (
            <div className="mb-6 rounded-lg overflow-hidden bg-light-bg-base dark:bg-dark-bg-base">
              <img
                src={campaign.about_image_url}
                alt={`About ${campaign.title}`}
                className="w-full h-auto object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : null}
          <div className="prose dark:prose-invert max-w-none prose-p:mx-auto prose-p:text-base md:prose-p:text-lg">
            <div
              className="text-light-text-base dark:text-dark-text-base"
              dangerouslySetInnerHTML={{ __html: campaign.story_content || campaign.description }}
            />
          </div>
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LocalizedClientLink href="#support">
              <Button size="xlarge" className="!bg-primary hover:!bg-primary-hover !text-white !border-primary transition-transform duration-150 hover:-translate-y-0.5 w-full">
                Support This Campaign
              </Button>
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CampaignStory