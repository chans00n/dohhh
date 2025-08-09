import { Migration } from "@mikro-orm/migrations"

export class Migration20250806000001 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "fundraising_contribution" (
        "id" varchar(255) NOT NULL,
        "campaign_id" text NOT NULL,
        "order_id" text NOT NULL,
        "customer_id" text NULL,
        "amount" text NOT NULL,
        "cookies_purchased" integer NOT NULL DEFAULT 0,
        "contributor_name" text NULL,
        "contributor_email" text NULL,
        "is_anonymous" boolean NOT NULL DEFAULT false,
        "message" text NULL,
        "status" text CHECK ("status" IN ('pending', 'completed', 'refunded')) NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "fundraising_contribution_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "fundraising_contribution_campaign_id_foreign" FOREIGN KEY ("campaign_id") REFERENCES "fundraising_campaign" ("id") ON UPDATE CASCADE
      );
    `)

    // Create indexes for better query performance
    this.addSql(`CREATE INDEX "idx_fundraising_contribution_campaign_id" ON "fundraising_contribution" ("campaign_id");`)
    this.addSql(`CREATE INDEX "idx_fundraising_contribution_order_id" ON "fundraising_contribution" ("order_id");`)
    this.addSql(`CREATE INDEX "idx_fundraising_contribution_customer_id" ON "fundraising_contribution" ("customer_id");`)
    this.addSql(`CREATE INDEX "idx_fundraising_contribution_status" ON "fundraising_contribution" ("status");`)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "fundraising_contribution";`)
  }
}