import { Migration } from '@mikro-orm/migrations';

export class Migration20250806000000 extends Migration {

  override async up(): Promise<void> {
    // Create fundraising_campaign table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "fundraising_campaign" (
        "id" varchar(255) NOT NULL,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "story_content" text NULL,
        "impact_content" text NULL,
        "cause_name" text NOT NULL,
        "goal_amount" numeric NOT NULL,
        "goal_cookies" numeric NOT NULL,
        "start_date" timestamptz NOT NULL,
        "end_date" timestamptz NOT NULL,
        "status" text CHECK ("status" IN ('draft', 'active', 'completed', 'cancelled')) NOT NULL,
        "featured_image_url" text NULL,
        "video_url" text NULL,
        "organizer_name" text NULL,
        "organizer_title" text NULL,
        "organizer_bio" text NULL,
        "organizer_image" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "fundraising_campaign_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create fundraising_stats table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "fundraising_stats" (
        "id" varchar(255) NOT NULL,
        "total_raised" numeric NOT NULL DEFAULT 0,
        "total_cookies_sold" numeric NOT NULL DEFAULT 0,
        "total_backers" numeric NOT NULL DEFAULT 0,
        "average_contribution" numeric NOT NULL DEFAULT 0,
        "last_updated" timestamptz NOT NULL,
        "campaign_id" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "fundraising_stats_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "fundraising_stats_campaign_id_foreign" FOREIGN KEY ("campaign_id") REFERENCES "fundraising_campaign" ("id") ON UPDATE CASCADE ON DELETE CASCADE
      );
    `);

    // Create fundraising_milestone table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "fundraising_milestone" (
        "id" varchar(255) NOT NULL,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "target_amount" numeric NOT NULL,
        "reached_at" timestamptz NULL,
        "order" numeric NOT NULL,
        "campaign_id" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "fundraising_milestone_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "fundraising_milestone_campaign_id_foreign" FOREIGN KEY ("campaign_id") REFERENCES "fundraising_campaign" ("id") ON UPDATE CASCADE ON DELETE CASCADE
      );
    `);

    // Create fundraising_update table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "fundraising_update" (
        "id" varchar(255) NOT NULL,
        "title" text NOT NULL,
        "content" text NOT NULL,
        "campaign_id" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "fundraising_update_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "fundraising_update_campaign_id_foreign" FOREIGN KEY ("campaign_id") REFERENCES "fundraising_campaign" ("id") ON UPDATE CASCADE ON DELETE CASCADE
      );
    `);

    // Create indexes
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_fundraising_campaign_status" ON "fundraising_campaign" ("status");');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_fundraising_campaign_start_date" ON "fundraising_campaign" ("start_date");');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_fundraising_campaign_end_date" ON "fundraising_campaign" ("end_date");');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_fundraising_stats_campaign_id" ON "fundraising_stats" ("campaign_id");');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_fundraising_milestone_campaign_id" ON "fundraising_milestone" ("campaign_id");');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_fundraising_update_campaign_id" ON "fundraising_update" ("campaign_id");');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_fundraising_update_created_at" ON "fundraising_update" ("created_at");');
  }

  override async down(): Promise<void> {
    // Drop tables in reverse order due to foreign key constraints
    this.addSql('DROP TABLE IF EXISTS "fundraising_update";');
    this.addSql('DROP TABLE IF EXISTS "fundraising_milestone";');
    this.addSql('DROP TABLE IF EXISTS "fundraising_stats";');
    this.addSql('DROP TABLE IF EXISTS "fundraising_campaign";');
  }
}