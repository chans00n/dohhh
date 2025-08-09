-- Add deleted_at columns to all Medusa tables that need them
-- This fixes the "column s0.deleted_at does not exist" error

-- Helper function to add deleted_at column if it doesn't exist
DO $$ 
DECLARE
    t text;
BEGIN
    -- List of common Medusa tables that should have deleted_at
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name IN (
            'store',
            'sales_channel',
            'stock_location',
            'product',
            'product_variant',
            'product_category',
            'product_collection',
            'product_option',
            'product_option_value',
            'product_type',
            'product_tag',
            'price_list',
            'price_set',
            'price',
            'customer',
            'customer_group',
            'cart',
            'order',
            'payment',
            'payment_collection',
            'refund',
            'region',
            'currency',
            'tax_rate',
            'tax_region',
            'shipping_option',
            'shipping_method',
            'fulfillment',
            'fulfillment_set',
            'return',
            'claim',
            'swap',
            'notification',
            'api_key',
            'user',
            'invite',
            'batch_job',
            'discount',
            'discount_rule',
            'gift_card',
            'note',
            'notification_provider',
            'oauth',
            'publishable_api_key',
            'staged_job',
            'payment_session',
            'address',
            'country',
            'image',
            'return_reason',
            'shipping_profile',
            'fulfillment_provider',
            'payment_provider',
            'refund_reason',
            'money_amount',
            'line_item',
            'line_item_tax_line',
            'line_item_adjustment',
            'discount_condition',
            'discount_condition_customer_group',
            'discount_condition_product',
            'discount_condition_product_collection',
            'discount_condition_product_tag',
            'discount_condition_product_type',
            'order_edit',
            'order_item_change',
            'payment_method_token',
            'product_category_product',
            'product_variant_inventory_item',
            'region_country',
            'region_currency',
            'region_payment_provider',
            'sales_channel_location',
            'sales_channel_stock_location',
            'shipping_method_tax_line',
            'shipping_option_requirement',
            'tax_provider'
        )
    LOOP
        BEGIN
            -- Check if deleted_at column exists
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = t 
                AND column_name = 'deleted_at'
            ) THEN
                -- Add deleted_at column
                EXECUTE format('ALTER TABLE %I ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL', t);
                RAISE NOTICE 'Added deleted_at to table: %', t;
            ELSE
                RAISE NOTICE 'Table % already has deleted_at', t;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not add deleted_at to %: %', t, SQLERRM;
        END;
    END LOOP;
END $$;

-- Also add deleted_at to any table that starts with common Medusa prefixes
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND (
            table_name LIKE 'product_%' OR
            table_name LIKE 'order_%' OR
            table_name LIKE 'cart_%' OR
            table_name LIKE 'customer_%' OR
            table_name LIKE 'payment_%' OR
            table_name LIKE 'fulfillment_%' OR
            table_name LIKE 'discount_%' OR
            table_name LIKE 'price_%' OR
            table_name LIKE 'tax_%' OR
            table_name LIKE 'shipping_%' OR
            table_name LIKE 'stock_%' OR
            table_name LIKE 'sales_channel_%' OR
            table_name LIKE 'region_%' OR
            table_name LIKE 'store_%'
        )
    LOOP
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = t 
                AND column_name = 'deleted_at'
            ) THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL', t);
                RAISE NOTICE 'Added deleted_at to table: %', t;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Silently continue if table doesn't need deleted_at
                NULL;
        END;
    END LOOP;
END $$;

-- Add indexes for deleted_at columns
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'deleted_at'
    LOOP
        BEGIN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_deleted_at ON %I (deleted_at) WHERE deleted_at IS NOT NULL', t, t);
        EXCEPTION
            WHEN OTHERS THEN
                NULL;
        END;
    END LOOP;
END $$;

-- Verify the changes
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'deleted_at'
ORDER BY table_name;