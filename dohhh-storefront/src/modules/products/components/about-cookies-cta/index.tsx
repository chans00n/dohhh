import React from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

type AboutCookiesCTAProps = {
  product?: HttpTypes.StoreProduct
}

const AboutCookiesCTA = ({ product }: AboutCookiesCTAProps) => {
  // Get data from product metadata or use defaults
  const metadata = product?.metadata || {}
  
  // Default configuration
  const defaultConfig = {
    imageUrl: "",
    imageAlt: "Freshly baked cookies",
    sectionTitle: "ABOUT OUR COOKIES",
    headline: "At our bakery, we believe in the power of simple, fresh ingredients and a passion for baking.",
    description: "We're a family-owned bakery crafting small-batch cookies with love and care. Every cookie is made fresh daily using premium ingredients and time-tested recipes passed down through generations.",
    features: ["100% Vegan", "Healthy Ingredients", "NTS", "Munchies"]
  }
  
  // Merge metadata with defaults
  const config = {
    imageUrl: metadata.about_image_url as string || defaultConfig.imageUrl,
    imageAlt: metadata.about_image_alt as string || defaultConfig.imageAlt,
    sectionTitle: metadata.about_section_title as string || defaultConfig.sectionTitle,
    headline: metadata.about_headline as string || defaultConfig.headline,
    description: metadata.about_description as string || defaultConfig.description,
    features: metadata.about_features ? 
      (typeof metadata.about_features === 'string' ? 
        metadata.about_features.split(',').map(f => f.trim()) : 
        metadata.about_features as string[]
      ) : defaultConfig.features
  }

  return (
    <section className="w-full py-16 bg-light-bg-card dark:bg-dark-bg-card">
      <div className="content-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left: Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-light-bg-hover dark:bg-dark-bg-hover">
            {config.imageUrl ? (
              <Image
                src={config.imageUrl}
                alt={config.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-light-text-muted dark:text-dark-text-muted">
                <div className="text-center">
                  <p className="text-sm">Cookie Image</p>
                  <p className="text-xs mt-1">Add about_image_url to product metadata</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Content */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm uppercase tracking-wider text-light-text-muted dark:text-dark-text-muted">
              {config.sectionTitle}
            </h2>
            <h3 className="text-3xl font-medium">
              {config.headline}
            </h3>
            <p className="text-light-text-muted dark:text-dark-text-muted">
              {config.description}
            </p>
          </div>
        </div>

        {/* Feature Banner */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
          {config.features.map((feature, index) => (
            <div key={index} className="flex-1 min-w-[150px]">
              <h4 className="text-lg font-medium uppercase">{feature}</h4>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AboutCookiesCTA