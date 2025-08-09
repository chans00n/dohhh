-- Reset admin password to: Admin123!
-- This is a bcrypt hash of the password "Admin123!"

UPDATE "user" 
SET password_hash = '$2b$10$K7L1OJ0TfmHrPMt3jchOYeYLqBxCkw8wJ6zAk4gBHZmqHZdYLsVcm' 
WHERE email = 'admin@dohhh.shop';

-- Note: After running this SQL, you can login with:
-- Email: admin@dohhh.shop
-- Password: Admin123!
--
-- IMPORTANT: Change this password immediately after logging in!