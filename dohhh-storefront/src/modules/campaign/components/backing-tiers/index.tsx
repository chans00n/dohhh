"use client"

import React from "react"
import { Button } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { cn } from "@lib/utils"
import { Product } from "@medusajs/types"

interface BackingTiersProps {
  products: Product[]
  campaign: any
  className?: string
}

const BackingTiers: React.FC<BackingTiersProps> = ({ products, campaign, className }) => {
  if (!products || products.length === 0) return null

  // Transform products into backing tiers - one per product with starting price
  const tiers = products.map((product) => {
    // Find the lowest priced variant
    let lowestPrice = Infinity
    let lowestPriceVariant = product.variants?.[0]
    
    product.variants?.forEach(variant => {
      const price = variant.prices?.[0]?.amount || 0
      if (price > 0 && price < lowestPrice) {
        lowestPrice = price
        lowestPriceVariant = variant
      }
    })
    
    // Extract cookie count from the lowest price variant
    let cookieCount = 4 // Default to 4 pack
    const variantTitle = lowestPriceVariant?.title || ""
    const packMatch = variantTitle.match(/(\d+)\s*Pack/i)
    if (packMatch) {
      cookieCount = parseInt(packMatch[1])
    }
    
    return {
      id: product.id,
      title: product.title,
      description: product.subtitle || product.description,
      amount: lowestPrice === Infinity ? 0 : lowestPrice,
      cookieCount: cookieCount,
      image: product.thumbnail,
      metadata: product.metadata,
      handle: product.handle,
    }
  }).filter(tier => tier.amount > 0) // Only show products with valid prices
    .sort((a, b) => a.amount - b.amount) // Sort by price ascending

  return (
    <section id="support" className={cn("py-16 md:py-24 bg-light-bg-base dark:bg-dark-bg-base", className)}>
      <div className="content-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-light-text-base dark:text-dark-text-base mb-4">
            Support {campaign.cause_name}
          </h2>
          <p className="text-lg text-light-text-muted dark:text-dark-text-muted max-w-2xl mx-auto">
            Every cookie purchase directly supports our campaign. Choose your contribution level below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => {
            // Only the regular Chocolate Chip Walnut (not GF) is popular
            const isPopular = tier.title === "Chocolate Chip Walnut" || tier.title === "Chocolate Chip Walnut Cookie"
            const impactPercentage = ((tier.amount / campaign.goal_amount) * 100).toFixed(2)
            
            return (
              <div
                key={tier.id}
                className={cn(
                  "relative bg-light-bg-card dark:bg-dark-bg-card rounded-lg border-2 transition-all hover:shadow-lg hover:shadow-primary/10",
                  isPopular
                    ? "border-primary scale-105 shadow-lg"
                    : "border-light-border dark:border-dark-border hover:border-primary/50"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Product Image */}
                  {tier.image && (
                    <div className="mb-6 rounded-lg overflow-hidden bg-light-bg-hover dark:bg-dark-bg-hover">
                      <img
                        src={tier.image}
                        alt={tier.title}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}

                  {/* Tier Info */}
                  <h3 className="text-xl font-semibold text-light-text-base dark:text-dark-text-base mb-2">
                    {tier.title}
                  </h3>
                  
                  <div className="mb-2">
                    <span className="text-sm text-light-text-muted dark:text-dark-text-muted">Starting at</span>
                    <div className="text-3xl font-bold text-primary">
                      $6.99
                    </div>
                  </div>

                  <p className="text-sm text-light-text-muted dark:text-dark-text-muted mb-4 min-h-[3rem]">
                    {tier.description}
                  </p>

                  {/* What You Get */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-light-text-base dark:text-dark-text-base">
                        All the delicious cookies you want
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-light-text-base dark:text-dark-text-base">
                        Delivered or Picked Up
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-light-text-base dark:text-dark-text-base">
                        Direct support to {campaign.cause_name}
                      </span>
                    </div>

                    {tier.metadata?.special_perk && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                        <span className="text-sm text-light-text-base dark:text-dark-text-base">
                          {tier.metadata.special_perk}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <LocalizedClientLink href={`/products/${tier.handle}`} prefetch>
                    <Button
                      className={cn(
                        "w-full transition-transform duration-150 hover:-translate-y-0.5",
                        isPopular
                          ? "!bg-primary hover:!bg-primary-hover !text-white !border-primary"
                          : "!bg-light-bg-hover dark:!bg-dark-bg-hover !text-light-text-base dark:!text-dark-text-base !border-light-border dark:!border-dark-border hover:!bg-primary hover:!text-white hover:!border-primary"
                      )}
                    >
                      Choose This Tier
                    </Button>
                  </LocalizedClientLink>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

export default BackingTiers