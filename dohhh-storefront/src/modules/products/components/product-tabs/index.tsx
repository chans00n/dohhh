"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Ingredients",
      component: <IngredientsTab product={product} />,
    },
    {
      label: "Shipping & Returns",
      component: <ShippingInfoTab />,
    },
    {
      label: "Description",
      component: <DescriptionTab product={product} />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple" defaultValue={["Ingredients"]}>
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const IngredientsTab = ({ product }: ProductTabsProps) => {
  // In a real implementation, ingredients would be stored in product metadata
  // For now, we'll use placeholder text that can be replaced with actual data
  return (
    <div className="text-base py-8">
      <p className="text-light-text-muted dark:text-dark-text-muted">
        {product.metadata?.ingredients as string || 
        "Premium flour, butter, sugar, eggs, vanilla extract, and our signature blend of natural ingredients. All cookies are made fresh daily in small batches."}
      </p>
      {product.metadata?.allergens && (
        <p className="mt-4 text-base text-light-text-muted dark:text-dark-text-muted">
          <span className="font-semibold">Allergens:</span> {product.metadata.allergens as string}
        </p>
      )}
    </div>
  )
}

const DescriptionTab = ({ product }: ProductTabsProps) => {
  return (
    <div className="text-base py-8">
      <div className="prose prose-base max-w-none text-light-text-muted dark:text-dark-text-muted">
        {product.description || "Indulge in our handcrafted cookies, made with love and the finest ingredients."}
      </div>
      {product.metadata?.detailed_description && (
        <div className="mt-4 text-light-text-muted dark:text-dark-text-muted">
          {product.metadata.detailed_description as string}
        </div>
      )}
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-base py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">Fast delivery</span>
            <p className="max-w-sm text-light-text-muted dark:text-dark-text-muted">
              Your package will arrive in 3-5 business days at your pick up
              location or in the comfort of your home.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">Simple exchanges</span>
            <p className="max-w-sm text-light-text-muted dark:text-dark-text-muted">
              Is the fit not quite right? No worries - we&apos;ll exchange your
              product for a new one.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">Easy returns</span>
            <p className="max-w-sm text-light-text-muted dark:text-dark-text-muted">
              Just return your product and we&apos;ll refund your money. No
              questions asked – we&apos;ll do our best to make sure your return
              is hassle-free.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
