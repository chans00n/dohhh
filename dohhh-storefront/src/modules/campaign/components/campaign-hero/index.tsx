"use client"

import React from "react"
import { Button } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useEffect, useRef, useState } from "react"

interface CampaignHeroProps {
  campaign: any
  stats: any
}

const AnimatedCounter = ({ value, prefix = "" }: { value: number; prefix?: string }) => {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const target = Math.max(0, value)
    const duration = 800
    const start = performance.now()
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      setDisplay(Math.floor(p * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])
  return (
    <div className="text-3xl font-bold text-primary">
      <span ref={ref}>{prefix}{display.toLocaleString()}</span>
    </div>
  )
}

const CampaignHero: React.FC<CampaignHeroProps> = ({ campaign, stats }) => {
  if (!campaign) return null

  const daysRemaining = stats?.days_remaining || 0
  const percentageRaised = stats?.percentage_amount || 0
  const safePercentage = Math.max(0, Math.min(Number.isFinite(percentageRaised) ? percentageRaised : 0, 100))
  const totalRaised = stats?.total_raised || 0
  const totalBackers = stats?.total_backers || 0
  const totalCookiesSold = stats?.total_cookies_sold || 0

  return (
    <section className="relative w-full min-h-[600px] bg-light-bg-base dark:bg-dark-bg-base overflow-hidden">
      {/* Background Image/Video */}
      {campaign.featured_image_url && (
        <div className="absolute inset-0 z-0">
          <img
            src={campaign.featured_image_url}
            alt={campaign.title}
            className="w-full h-full object-cover opacity-20 dark:opacity-10"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-light-bg-base dark:to-dark-bg-base" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 content-container py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Campaign Tag */}
          <div className="mb-4">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              Supporting {campaign.cause_name}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-light-text-base dark:text-dark-text-base mb-6">
            {campaign.title}
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-light-text-muted dark:text-dark-text-base/80 mb-8 max-w-2xl mx-auto">
            {campaign.description}
          </p>

          {/* Stats Grid with count-up animation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[{
              label: `raised of ${(campaign.goal_amount / 100).toLocaleString()} goal`,
              value: Math.round(totalRaised / 100),
              prefix: "$",
            }, {
              label: "cookie lovers supporting",
              value: totalBackers,
            }, {
              label: "cookies sold",
              value: totalCookiesSold,
            }].map((stat, idx) => (
              <div key={idx} className="bg-light-bg-card dark:bg-dark-bg-card p-6 rounded-lg border border-light-border dark:border-dark-border text-center">
                <AnimatedCounter value={stat.value} prefix={stat.prefix} />
                <div className="text-sm text-light-text-muted dark:text-dark-text-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div
              role="progressbar"
              aria-label="Campaign funding progress"
              aria-valuenow={Number.isFinite(safePercentage) ? Number(safePercentage.toFixed(1)) : 0}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full bg-light-bg-hover dark:bg-dark-bg-hover rounded-full h-4 overflow-hidden"
            >
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${safePercentage}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-light-text-muted dark:text-dark-text-muted">
              {safePercentage.toFixed(1)}% funded
              <span className="sr-only"> out of 100 percent</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LocalizedClientLink href="#support">
              <Button size="xlarge" className="!bg-primary hover:!bg-primary-hover !text-white !border-primary transition-transform duration-150 hover:-translate-y-0.5 w-full">
                Support This Campaign
              </Button>
            </LocalizedClientLink>
            <LocalizedClientLink href="#story">
              <Button size="xlarge" variant="secondary" className="!bg-light-bg-card dark:!bg-dark-bg-card !text-light-text-base dark:!text-dark-text-base !border-light-border dark:!border-dark-border hover:!bg-light-bg-hover dark:hover:!bg-dark-bg-hover transition-transform duration-150 hover:-translate-y-0.5 w-full">
                Learn More
              </Button>
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CampaignHero