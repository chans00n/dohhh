-- Update password in auth_identity table (the correct location for Medusa v2)
-- New password will be: Admin123!
-- The bcrypt hash below is for the password "Admin123!"

UPDATE auth_identity 
SET provider_metadata = '{"password": "$2b$10$K7L1OJ0TfmHrPMt3jchOYeYLqBxCkw8wJ6zAk4gBHZmqHZdYLsVcm"}'::jsonb
WHERE provider = 'emailpass' 
  AND entity_id IN (
    SELECT id FROM "user" WHERE email = 'admin@dohhh.shop'
  );

-- Alternative: If the entity_id doesn't match, update by the actual entity_id you see
-- UPDATE auth_identity 
-- SET provider_metadata = '{"password": "$2b$10$K7L1OJ0TfmHrPMt3jchOYeYLqBxCkw8wJ6zAk4gBHZmqHZdYLsVcm"}'::jsonb
-- WHERE id = 'autid_01J4wp9422p286d3a4fff';

-- Verify the update
SELECT 
    ai.id,
    ai.entity_id,
    ai.provider,
    ai.provider_metadata,
    u.email
FROM auth_identity ai
JOIN "user" u ON u.id = ai.entity_id
WHERE ai.provider = 'emailpass';