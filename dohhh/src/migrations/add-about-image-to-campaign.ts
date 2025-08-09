import { Migration } from "@mikro-orm/migrations"

export class AddAboutImageToCampaign extends Migration {
  async up(): Promise<void> {
    // Add about_image_url column to fundraising_campaign table
    this.addSql(`
      ALTER TABLE "fundraising_campaign" 
      ADD COLUMN IF NOT EXISTS "about_image_url" text
    `)
  }

  async down(): Promise<void> {
    // Remove the column if rolling back
    this.addSql(`
      ALTER TABLE "fundraising_campaign" 
      DROP COLUMN IF EXISTS "about_image_url"
    `)
  }
}