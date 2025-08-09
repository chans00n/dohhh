-- Check if there's a password_hash column in the user table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user' 
AND column_name LIKE '%password%';

-- Check the full user record
SELECT * FROM "user" WHERE email = 'admin@dohhh.shop';

-- Check if there are any other auth-related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%auth%' OR table_name LIKE '%session%')
ORDER BY table_name;

-- Check the full auth_identity record
SELECT * FROM auth_identity WHERE entity_id = 'usr_da1f5903000d6b8506b426e2';