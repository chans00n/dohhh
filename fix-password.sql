-- Update password in auth_identity table - ALL ON ONE LINE
UPDATE auth_identity SET provider_metadata = '{"password": "$2b$10$K7L1OJ0TfmHrPMt3jchOYeYLqBxCkw8wJ6zAk4gBHZmqHZdYLsVcm"}'::jsonb WHERE provider = 'emailpass' AND entity_id = 'usr_01J4tfbb2d00ddb806e420e';

-- Verify the update
SELECT entity_id, provider, provider_metadata FROM auth_identity WHERE provider = 'emailpass';