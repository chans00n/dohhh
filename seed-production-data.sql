-- Seed production data for Medusa
-- Run this in your Supabase SQL editor after creating the admin user

-- First, let's check if we have regions (should already exist from init script)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM region WHERE id = 'region_us') THEN
        INSERT INTO region (id, name, currency_code, tax_rate)
        VALUES ('region_us', 'United States', 'usd', 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM region WHERE id = 'region_eu') THEN
        INSERT INTO region (id, name, currency_code, tax_rate)
        VALUES ('region_eu', 'Europe', 'eur', 0);
    END IF;
END $$;

-- Create product categories
INSERT INTO product_category (id, name, handle, mpath, is_active)
VALUES 
    ('cat_cookies', 'Cookies', 'cookies', 'cookies.', true),
    ('cat_fundraising', 'Fundraising', 'fundraising', 'fundraising.', true)
ON CONFLICT (id) DO NOTHING;

-- Create fundraising products
INSERT INTO product (id, title, handle, description, status, thumbnail, metadata)
VALUES 
    ('prod_01', 'Support Our Cookie Campaign', 'support-cookie-campaign', 
     'Help us reach our goal by purchasing delicious homemade cookies!', 
     'published', 
     'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800',
     '{"campaign_product": true}'::jsonb),
    
    ('prod_02', 'Chocolate Chip Cookies - Dozen', 'chocolate-chip-dozen',
     'Classic homemade chocolate chip cookies. Perfect for any occasion!',
     'published',
     'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800',
     '{"type": "cookie"}'::jsonb),
     
    ('prod_03', 'Sugar Cookies - Dozen', 'sugar-cookies-dozen',
     'Sweet and simple sugar cookies with a perfect crispy edge.',
     'published',
     'https://images.unsplash.com/photo-1621236378699-8597faf6a176?w=800',
     '{"type": "cookie"}'::jsonb),
     
    ('prod_04', 'Oatmeal Raisin Cookies - Dozen', 'oatmeal-raisin-dozen',
     'Hearty oatmeal cookies with plump raisins and a hint of cinnamon.',
     'published',
     'https://images.unsplash.com/photo-1590080875897-b7b65b2f73d7?w=800',
     '{"type": "cookie"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Create product variants with prices
INSERT INTO product_variant (id, product_id, title, sku, inventory_quantity, manage_inventory, variant_rank)
VALUES 
    ('variant_01', 'prod_01', 'Default', 'CAMPAIGN-001', 1000, false, 0),
    ('variant_02', 'prod_02', 'Default', 'CHOC-CHIP-12', 100, true, 0),
    ('variant_03', 'prod_03', 'Default', 'SUGAR-12', 100, true, 0),
    ('variant_04', 'prod_04', 'Default', 'OATMEAL-12', 100, true, 0)
ON CONFLICT (id) DO NOTHING;

-- Create a sample campaign
INSERT INTO fundraising.campaign (
    id, name, description, campaign_type, goal_amount, 
    currency_code, starts_at, ends_at, product_id, about_image_url
)
VALUES (
    'camp_01',
    'School Bake Sale Fundraiser',
    'Help us raise funds for new playground equipment by purchasing our delicious homemade cookies!',
    'flexible',
    5000.00,
    'usd',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '25 days',
    'prod_01',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'
) ON CONFLICT (id) DO NOTHING;

-- Create some sample contributions (optional - for demo purposes)
INSERT INTO fundraising.contribution (
    id, campaign_id, amount, currency_code, status, customer_id
)
VALUES 
    ('contrib_01', 'camp_01', 25.00, 'usd', 'completed', null),
    ('contrib_02', 'camp_01', 50.00, 'usd', 'completed', null),
    ('contrib_03', 'camp_01', 100.00, 'usd', 'completed', null)
ON CONFLICT (id) DO NOTHING;

-- Create a campaign update
INSERT INTO fundraising.campaign_update (
    id, campaign_id, title, content
)
VALUES (
    'update_01',
    'camp_01',
    'Great Progress!',
    'Thanks to all our supporters! We have reached 30% of our goal in just 5 days. Keep spreading the word!'
) ON CONFLICT (id) DO NOTHING;

-- Summary
SELECT 'Data seeded successfully!' as message;

-- Show what was created
SELECT 
    'Products' as type, 
    COUNT(*) as count 
FROM product
UNION ALL
SELECT 
    'Categories' as type, 
    COUNT(*) as count 
FROM product_category
UNION ALL
SELECT 
    'Campaigns' as type, 
    COUNT(*) as count 
FROM fundraising.campaign
UNION ALL
SELECT 
    'Contributions' as type, 
    COUNT(*) as count 
FROM fundraising.contribution;