import { Migration } from '@mikro-orm/migrations';

export class Migration20250808200532 extends Migration {

  override async up(): Promise<void> {
    // Only add the about_image_url column - contribution table already exists
    this.addSql(`alter table if exists "fundraising_campaign" add column if not exists "about_image_url" text null;`);
  }

  override async down(): Promise<void> {
    // Only drop the about_image_url column
    this.addSql(`alter table if exists "fundraising_campaign" drop column if exists "about_image_url";`);
  }

}
