-- Create auth identity for the admin user
-- User ID: usr_da1f5903000d6b8506b426e2

INSERT INTO auth_identity (
    id,
    entity_id,
    provider,
    provider_metadata,
    created_at,
    updated_at
) VALUES (
    'authid_' || substr(md5(random()::text), 1, 21),
    'usr_da1f5903000d6b8506b426e2',
    'emailpass',
    '{"password": "$2a$10$M1.O/M3qUCTs5chRWUPxCODk3bUULraqPmDRPVNceNhLPqmcMIEOC"}',
    NOW(),
    NOW()
) ON CONFLICT (entity_id, provider) DO UPDATE
SET provider_metadata = '{"password": "$2a$10$M1.O/M3qUCTs5chRWUPxCODk3bUULraqPmDRPVNceNhLPqmcMIEOC"}',
    updated_at = NOW();

-- This creates the authentication for:
-- Email: admin@dohhh.shop
-- Password: Admin123!
-- Please change this password after first login!