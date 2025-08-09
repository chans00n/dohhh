import { Modules, ProductStatus } from "@medusajs/framework/utils"

export default async function seedCookieProducts({ container }) {
  const productModule = container.resolve(Modules.PRODUCT)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  
  console.log("Seeding cookie products...")
  
  try {
    // Get default sales channel
    const [defaultSalesChannel] = await salesChannelModule.listSalesChannels({
      name: "Default Sales Channel",
    })
    
    if (!defaultSalesChannel) {
      console.error("Default sales channel not found")
      return
    }
    
    // Get shipping profile
    const shippingProfiles = await fulfillmentModule.listShippingProfiles({
      type: "default"
    })
    const shippingProfile = shippingProfiles[0]
    
    if (!shippingProfile) {
      console.error("Default shipping profile not found")
      return
    }
    
    // Create cookie products
    const cookieProducts = [
      {
        title: "Classic Chocolate Chip Cookie 4-Pack",
        description: "Our signature chocolate chip cookies made with premium Belgian chocolate chunks. Pack of 4 cookies.",
        handle: "classic-chocolate-chip-4pack",
        weight: 200,
        status: ProductStatus.PUBLISHED,
        metadata: {
          cookie_count: "4",
        },
        images: [{
          url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80",
        }],
        options: [],
        variants: [{
          title: "4 Pack",
          sku: "COOKIE-CHOC-4",
          prices: [
            { amount: 699, currency_code: "eur" }, // €6.99
            { amount: 699, currency_code: "usd" }, // $6.99
          ],
        }],
        sales_channels: [{ id: defaultSalesChannel.id }],
      },
      {
        title: "Classic Chocolate Chip Cookie 6-Pack",
        description: "Our signature chocolate chip cookies made with premium Belgian chocolate chunks. Pack of 6 cookies.",
        handle: "classic-chocolate-chip-6pack",
        weight: 300,
        status: ProductStatus.PUBLISHED,
        metadata: {
          cookie_count: "6",
          special_perk: "Free thank you card included",
        },
        images: [{
          url: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80",
        }],
        options: [],
        variants: [{
          title: "6 Pack",
          sku: "COOKIE-CHOC-6",
          prices: [
            { amount: 999, currency_code: "eur" }, // €9.99
            { amount: 999, currency_code: "usd" }, // $9.99
          ],
        }],
        sales_channels: [{ id: defaultSalesChannel.id }],
      },
      {
        title: "Classic Chocolate Chip Cookie 8-Pack",
        description: "Our signature chocolate chip cookies made with premium Belgian chocolate chunks. Pack of 8 cookies - perfect for sharing!",
        handle: "classic-chocolate-chip-8pack",
        weight: 400,
        status: ProductStatus.PUBLISHED,
        metadata: {
          cookie_count: "8",
          special_perk: "Premium gift box included",
        },
        images: [{
          url: "https://images.unsplash.com/photo-1486893732792-ab0085cb2d43?w=800&q=80",
        }],
        options: [],
        variants: [{
          title: "8 Pack",
          sku: "COOKIE-CHOC-8",
          prices: [
            { amount: 1299, currency_code: "eur" }, // €12.99
            { amount: 1299, currency_code: "usd" }, // $12.99
          ],
        }],
        sales_channels: [{ id: defaultSalesChannel.id }],
      },
      {
        title: "Assorted Cookie Box (12 Pack)",
        description: "A delightful assortment of our best cookies including chocolate chip, oatmeal raisin, and sugar cookies. 12 cookies total.",
        handle: "assorted-cookie-box-12",
        weight: 600,
        status: ProductStatus.PUBLISHED,
        metadata: {
          cookie_count: "12",
          special_perk: "Premium gift box and personalized thank you note",
        },
        images: [{
          url: "https://images.unsplash.com/photo-1486893732792-ab0085cb2d43?w=800&q=80",
        }],
        options: [],
        variants: [{
          title: "12 Pack Assorted",
          sku: "COOKIE-ASSORTED-12",
          prices: [
            { amount: 1999, currency_code: "eur" }, // €19.99
            { amount: 1999, currency_code: "usd" }, // $19.99
          ],
        }],
        sales_channels: [{ id: defaultSalesChannel.id }],
      },
      {
        title: "Corporate Cookie Catering (50 Pack)",
        description: "Perfect for corporate events, meetings, or large gatherings. 50 freshly baked assorted cookies with custom packaging options.",
        handle: "corporate-catering-50",
        weight: 2500,
        status: ProductStatus.PUBLISHED,
        metadata: {
          cookie_count: "50",
          special_perk: "Custom branding available and recognition on our donor wall",
        },
        images: [{
          url: "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=800&q=80",
        }],
        options: [],
        variants: [{
          title: "50 Cookie Catering Pack",
          sku: "COOKIE-CORP-50",
          prices: [
            { amount: 7999, currency_code: "eur" }, // €79.99
            { amount: 7999, currency_code: "usd" }, // $79.99
          ],
        }],
        sales_channels: [{ id: defaultSalesChannel.id }],
      },
    ]
    
    // Create each product
    for (const productData of cookieProducts) {
      const product = await productModule.createProducts({
        ...productData,
        shipping_profile_id: shippingProfile.id,
      })
      console.log(`Created product: ${product.title}`)
    }
    
    console.log("\nCookie products seeded successfully!")
    
  } catch (error) {
    console.error("Error seeding cookie products:", error)
    throw error
  }
}