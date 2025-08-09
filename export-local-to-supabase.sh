#!/bin/bash

# Export local SQLite data to SQL format for Supabase

echo "Exporting data from local SQLite database..."

# Path to your local SQLite database
DB_PATH="dohhh/.medusa/data.db"

if [ ! -f "$DB_PATH" ]; then
  echo "Error: Database file not found at $DB_PATH"
  exit 1
fi

# Export products
echo "-- Products" > export-to-supabase.sql
sqlite3 "$DB_PATH" <<EOF >> export-to-supabase.sql
.mode insert product
SELECT * FROM product WHERE deleted_at IS NULL;
EOF

# Export product variants
echo -e "\n-- Product Variants" >> export-to-supabase.sql
sqlite3 "$DB_PATH" <<EOF >> export-to-supabase.sql
.mode insert product_variant
SELECT * FROM product_variant WHERE deleted_at IS NULL;
EOF

# Export categories
echo -e "\n-- Product Categories" >> export-to-supabase.sql
sqlite3 "$DB_PATH" <<EOF >> export-to-supabase.sql
.mode insert product_category
SELECT * FROM product_category;
EOF

# Export campaigns from fundraising schema
echo -e "\n-- Campaigns" >> export-to-supabase.sql
sqlite3 "$DB_PATH" <<EOF >> export-to-supabase.sql
.mode insert fundraising.campaign
SELECT * FROM fundraising_campaign WHERE deleted_at IS NULL;
EOF

# Export contributions
echo -e "\n-- Contributions" >> export-to-supabase.sql
sqlite3 "$DB_PATH" <<EOF >> export-to-supabase.sql
.mode insert fundraising.contribution
SELECT * FROM fundraising_contribution WHERE deleted_at IS NULL;
EOF

# Export campaign updates
echo -e "\n-- Campaign Updates" >> export-to-supabase.sql
sqlite3 "$DB_PATH" <<EOF >> export-to-supabase.sql
.mode insert fundraising.campaign_update
SELECT * FROM fundraising_campaign_update WHERE deleted_at IS NULL;
EOF

echo "Export completed! Check export-to-supabase.sql"
echo "Review the file and run it in your Supabase SQL editor."