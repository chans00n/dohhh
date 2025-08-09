import { ExecArgs } from "@medusajs/framework/types"
import { FUNDRAISING_MODULE } from "../modules/fundraising"
import * as fs from "fs"
import * as path from "path"

export default async function exportToSQL({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  const fundraisingModuleService = container.resolve(FUNDRAISING_MODULE) as any

  logger.info("Exporting data to SQL format...")

  let sqlContent = `-- Export from local Medusa database
-- Generated on ${new Date().toISOString()}
-- Run this in your Supabase SQL editor

`;

  try {
    // Export products
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id", "title", "handle", "description", "status", 
        "thumbnail", "metadata", "created_at", "updated_at"
      ]
    })
    
    if (products.length > 0) {
      sqlContent += "-- Products\n"
      for (const product of products) {
        const metadata = product.metadata ? `'${JSON.stringify(product.metadata)}'::jsonb` : "NULL"
        sqlContent += `INSERT INTO product (id, title, handle, description, status, thumbnail, metadata, created_at, updated_at) VALUES (
  '${product.id}', 
  '${product.title.replace(/'/g, "''")}', 
  '${product.handle}', 
  '${(product.description || '').replace(/'/g, "''")}', 
  '${product.status}', 
  ${product.thumbnail ? `'${product.thumbnail}'` : "NULL"}, 
  ${metadata},
  '${product.created_at}',
  '${product.updated_at}'
) ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail;

`
      }
    }

    // Export product variants
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: [
        "id", "product_id", "title", "sku", "inventory_quantity",
        "manage_inventory", "variant_rank", "created_at", "updated_at"
      ]
    })
    
    if (variants.length > 0) {
      sqlContent += "\n-- Product Variants\n"
      for (const variant of variants) {
        sqlContent += `INSERT INTO product_variant (id, product_id, title, sku, inventory_quantity, manage_inventory, variant_rank, created_at, updated_at) VALUES (
  '${variant.id}',
  '${variant.product_id}',
  '${variant.title.replace(/'/g, "''")}',
  ${variant.sku ? `'${variant.sku}'` : "NULL"},
  ${variant.inventory_quantity || 0},
  ${variant.manage_inventory},
  ${variant.variant_rank || 0},
  '${variant.created_at}',
  '${variant.updated_at}'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  sku = EXCLUDED.sku,
  inventory_quantity = EXCLUDED.inventory_quantity;

`
      }
    }

    // Export campaigns
    const campaigns = await fundraisingModuleService.listCampaigns()
    
    if (campaigns.length > 0) {
      sqlContent += "\n-- Campaigns\n"
      for (const campaign of campaigns) {
        const metadata = campaign.metadata ? `'${JSON.stringify(campaign.metadata)}'::jsonb` : "NULL"
        sqlContent += `INSERT INTO fundraising.campaign (id, name, description, campaign_type, goal_amount, currency_code, starts_at, ends_at, product_id, about_image_url, metadata, created_at, updated_at) VALUES (
  '${campaign.id}',
  '${campaign.name.replace(/'/g, "''")}',
  '${(campaign.description || '').replace(/'/g, "''")}',
  '${campaign.campaign_type}',
  ${campaign.goal_amount},
  '${campaign.currency_code}',
  '${campaign.starts_at}',
  '${campaign.ends_at}',
  ${campaign.product_id ? `'${campaign.product_id}'` : "NULL"},
  ${campaign.about_image_url ? `'${campaign.about_image_url}'` : "NULL"},
  ${metadata},
  '${campaign.created_at}',
  '${campaign.updated_at}'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  goal_amount = EXCLUDED.goal_amount;

`
      }
    }

    // Write to file
    const outputPath = path.join(process.cwd(), "..", "export-to-supabase.sql")
    fs.writeFileSync(outputPath, sqlContent)
    
    logger.info(`Export completed! File saved to: ${outputPath}`)
    logger.info(`Products: ${products.length}, Variants: ${variants.length}, Campaigns: ${campaigns.length}`)
    
  } catch (error) {
    logger.error("Error exporting data:", error)
    throw error
  }
}