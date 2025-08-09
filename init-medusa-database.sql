-- Initialize Medusa Database Schema
-- Run this in your Supabase SQL editor to create all required tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create migrations table
CREATE TABLE IF NOT EXISTS mikro_orm_migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create core Medusa tables
-- User table
CREATE TABLE IF NOT EXISTS "user" (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    avatar_url VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Auth identity table
CREATE TABLE IF NOT EXISTS auth_identity (
    id VARCHAR(255) PRIMARY KEY,
    entity_id VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_metadata JSONB,
    user_metadata JSONB,
    app_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT auth_identity_entity_id_provider_unique UNIQUE (entity_id, provider)
);

-- Store table
CREATE TABLE IF NOT EXISTS store (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'Medusa Store',
    supported_currencies JSONB,
    default_currency_code VARCHAR(3),
    default_location_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default store
INSERT INTO store (id, name, supported_currencies, default_currency_code)
VALUES (
    'store_01',
    'Medusa Store',
    '["usd", "eur"]'::jsonb,
    'usd'
) ON CONFLICT (id) DO NOTHING;

-- Region table
CREATE TABLE IF NOT EXISTS region (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    tax_rate NUMERIC(5,2),
    tax_code VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Insert default regions
INSERT INTO region (id, name, currency_code, tax_rate)
VALUES 
    ('region_us', 'United States', 'usd', 0),
    ('region_eu', 'Europe', 'eur', 0)
ON CONFLICT (id) DO NOTHING;

-- Product category table
CREATE TABLE IF NOT EXISTS product_category (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    handle VARCHAR(255) UNIQUE NOT NULL,
    parent_category_id VARCHAR(255),
    mpath VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES product_category(id)
);

-- Product table
CREATE TABLE IF NOT EXISTS product (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    handle VARCHAR(255) UNIQUE,
    description TEXT,
    is_giftcard BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'draft',
    thumbnail VARCHAR(255),
    weight NUMERIC(10,2),
    length NUMERIC(10,2),
    height NUMERIC(10,2),
    width NUMERIC(10,2),
    hs_code VARCHAR(255),
    origin_country VARCHAR(2),
    mid_code VARCHAR(255),
    material VARCHAR(255),
    metadata JSONB,
    discountable BOOLEAN DEFAULT TRUE,
    external_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Product variant table
CREATE TABLE IF NOT EXISTS product_variant (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    sku VARCHAR(255),
    barcode VARCHAR(255),
    ean VARCHAR(255),
    upc VARCHAR(255),
    variant_rank INTEGER DEFAULT 0,
    inventory_quantity INTEGER DEFAULT 0,
    allow_backorder BOOLEAN DEFAULT FALSE,
    manage_inventory BOOLEAN DEFAULT TRUE,
    hs_code VARCHAR(255),
    origin_country VARCHAR(2),
    mid_code VARCHAR(255),
    material VARCHAR(255),
    weight NUMERIC(10,2),
    length NUMERIC(10,2),
    height NUMERIC(10,2),
    width NUMERIC(10,2),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (product_id) REFERENCES product(id)
);

-- Customer table
CREATE TABLE IF NOT EXISTS customer (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    billing_address_id VARCHAR(255),
    phone VARCHAR(255),
    has_account BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Order table
CREATE TABLE IF NOT EXISTS "order" (
    id VARCHAR(255) PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'pending',
    display_id INTEGER,
    cart_id VARCHAR(255),
    customer_id VARCHAR(255),
    email VARCHAR(255),
    billing_address_id VARCHAR(255),
    shipping_address_id VARCHAR(255),
    region_id VARCHAR(255),
    currency_code VARCHAR(3),
    tax_rate NUMERIC(5,2),
    draft_order_id VARCHAR(255),
    canceled_at TIMESTAMPTZ,
    metadata JSONB,
    no_notification BOOLEAN DEFAULT FALSE,
    idempotency_key VARCHAR(255),
    external_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (region_id) REFERENCES region(id)
);

-- Cart table
CREATE TABLE IF NOT EXISTS cart (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255),
    billing_address_id VARCHAR(255),
    shipping_address_id VARCHAR(255),
    region_id VARCHAR(255),
    customer_id VARCHAR(255),
    payment_id VARCHAR(255),
    type VARCHAR(50) DEFAULT 'default',
    completed_at TIMESTAMPTZ,
    payment_authorized_at TIMESTAMPTZ,
    idempotency_key VARCHAR(255),
    context JSONB,
    metadata JSONB,
    sales_channel_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (region_id) REFERENCES region(id),
    FOREIGN KEY (customer_id) REFERENCES customer(id)
);

-- Create indexes for better performance
CREATE INDEX idx_product_handle ON product(handle);
CREATE INDEX idx_product_status ON product(status);
CREATE INDEX idx_order_customer_id ON "order"(customer_id);
CREATE INDEX idx_order_status ON "order"(status);
CREATE INDEX idx_cart_customer_id ON cart(customer_id);
CREATE INDEX idx_customer_email ON customer(email);

-- Create the fundraising module tables
CREATE SCHEMA IF NOT EXISTS fundraising;

-- Campaign model
CREATE TABLE IF NOT EXISTS fundraising.campaign (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN ('fixed', 'flexible')),
    goal_amount NUMERIC(10,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'usd',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    product_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    about_image_url VARCHAR(255)
);

-- Contribution model
CREATE TABLE IF NOT EXISTS fundraising.contribution (
    id VARCHAR(255) PRIMARY KEY,
    campaign_id VARCHAR(255) NOT NULL,
    order_id VARCHAR(255),
    customer_id VARCHAR(255),
    amount NUMERIC(10,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'usd',
    status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (campaign_id) REFERENCES fundraising.campaign(id)
);

-- Backer model
CREATE TABLE IF NOT EXISTS fundraising.backer (
    id VARCHAR(255) PRIMARY KEY,
    campaign_id VARCHAR(255) NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    contribution_id VARCHAR(255) NOT NULL,
    first_contribution_at TIMESTAMPTZ NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    contribution_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (campaign_id) REFERENCES fundraising.campaign(id),
    FOREIGN KEY (contribution_id) REFERENCES fundraising.contribution(id),
    CONSTRAINT unique_campaign_customer UNIQUE (campaign_id, customer_id)
);

-- Campaign update model
CREATE TABLE IF NOT EXISTS fundraising.campaign_update (
    id VARCHAR(255) PRIMARY KEY,
    campaign_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (campaign_id) REFERENCES fundraising.campaign(id)
);

-- Create indexes for fundraising tables
CREATE INDEX idx_campaign_product_id ON fundraising.campaign(product_id);
CREATE INDEX idx_campaign_dates ON fundraising.campaign(starts_at, ends_at);
CREATE INDEX idx_contribution_campaign_id ON fundraising.contribution(campaign_id);
CREATE INDEX idx_contribution_customer_id ON fundraising.contribution(customer_id);
CREATE INDEX idx_contribution_order_id ON fundraising.contribution(order_id);
CREATE INDEX idx_backer_campaign_id ON fundraising.backer(campaign_id);
CREATE INDEX idx_backer_customer_id ON fundraising.backer(customer_id);

-- Mark this as complete
INSERT INTO mikro_orm_migrations (name) VALUES ('InitialMedusaSchema');

COMMIT;