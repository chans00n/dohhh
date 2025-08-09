-- Create admin user in Medusa
-- Run this in your Supabase SQL editor

-- First, let's create the user
INSERT INTO "user" (
    id,
    email,
    first_name,
    last_name,
    created_at,
    updated_at
) VALUES (
    'usr_' || substr(md5(random()::text), 1, 24),
    'admin@dohhh.shop',
    'Admin',
    'User',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Note the user ID from above, then create the auth identity
-- Replace 'YOUR_USER_ID' with the actual ID returned above
-- Replace 'YOUR_PASSWORD_HASH' with a bcrypt hash of your password

-- You can generate a bcrypt hash at: https://bcrypt-generator.com/
-- Use 10 rounds for the hash

/*
INSERT INTO auth_identity (
    id,
    entity_id,
    provider,
    provider_metadata,
    created_at,
    updated_at
) VALUES (
    'authid_' || substr(md5(random()::text), 1, 21),
    'YOUR_USER_ID',
    'emailpass',
    '{"password": "YOUR_PASSWORD_HASH"}',
    NOW(),
    NOW()
);
*/