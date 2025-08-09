import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import AboutCookiesCTA from "@modules/products/components/about-cookies-cta"
import ScrollingBanner from "@modules/products/components/scrolling-banner"
import { Testimonials } from "../../../components/ui/testimonials"
import NewsletterSignup from "@modules/products/components/newsletter-signup"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { HttpTypes } from "@medusajs/types"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div className="content-container py-12 lg:py-16">
        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-8">
          {/* Left: Image Gallery */}
          <div className="w-full">
            <ImageGallery images={product?.images || []} />
          </div>

          {/* Right: Product Details */}
          <div className="flex flex-col gap-y-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-light-text-muted dark:text-dark-text-muted">
              <a href={`/${countryCode}`} className="hover:text-primary">Home</a>
              <span>/</span>
              {product.categories?.[0] && (
                <>
                  <a href={`/${countryCode}/categories/${product.categories[0].handle}`} className="hover:text-primary">
                    {product.categories[0].name}
                  </a>
                  <span>/</span>
                </>
              )}
              <span className="text-light-text-base dark:text-dark-text-base">{product.title}</span>
            </nav>

            <div>
              {product.categories?.[0] && (
                <p className="text-sm text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider mb-2">
                  {product.categories[0].name}
                </p>
              )}
              <h1 className="text-3xl font-medium">{product.title}</h1>
              <ProductInfo product={product} />
            </div>

            <Suspense
              fallback={
                <ProductActions
                  disabled={true}
                  product={product}
                  region={region}
                />
              }
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>

            {/* Product Details Accordion */}
            <ProductTabs product={product} />
          </div>
        </div>
      </div>

      {/* About Our Cookies CTA */}
      <AboutCookiesCTA product={product} />

      {/* Scrolling Banner */}
      <ScrollingBanner />

      {/* Testimonials */}
      <Testimonials 
        testimonials={[
          {
            quote: "These cookies are a game-changer! Definitely going to be my go-to for all my baking from now on!",
            author: "Sarah M.",
            role: "Verified Buyer",
            rating: 5
          },
          {
            quote: "The flavor was spot on—rich and velvety without being overly sweet. They melted beautifully!",
            author: "Michael R.",
            role: "Cookie Enthusiast",
            rating: 5
          },
          {
            quote: "These cookies are hands down the best I've ever tried! If you're a fan of chocolate in your baked goods, you need these in your pantry!",
            author: "Emma L.",
            role: "Home Baker",
            rating: 5
          },
          {
            quote: "Perfect texture - crispy on the outside and chewy on the inside. My kids ask for them every day!",
            author: "David K.",
            role: "Parent of 3",
            rating: 5
          },
          {
            quote: "I ordered these for a party and everyone loved them. The packaging was beautiful and they arrived fresh.",
            author: "Jessica T.",
            role: "Event Planner",
            rating: 5
          },
          {
            quote: "As someone with a sweet tooth, these cookies hit all the right notes. Will definitely order again!",
            author: "Robert P.",
            role: "Repeat Customer",
            rating: 5
          }
        ]}
      />

      {/* Related Products Section */}
      <div
        className="content-container my-16"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>

      {/* Newsletter Signup */}
      <NewsletterSignup />
    </>
  )
}

export default ProductTemplate
