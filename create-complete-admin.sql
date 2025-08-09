-- Complete admin user creation for Medusa
-- This creates both user and auth identity in one transaction

-- First, let's check if the user already exists
DO $$
DECLARE
    user_id VARCHAR(255);
    auth_id VARCHAR(255);
BEGIN
    -- Check if admin user already exists
    SELECT id INTO user_id FROM "user" WHERE email = 'admin@dohhh.shop';
    
    IF user_id IS NULL THEN
        -- Create the user if it doesn't exist
        user_id := 'usr_' || substr(md5(random()::text), 1, 24);
        
        INSERT INTO "user" (
            id,
            email,
            first_name,
            last_name,
            created_at,
            updated_at
        ) VALUES (
            user_id,
            'admin@dohhh.shop',
            'Admin',
            'User',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'User created with ID: %', user_id;
    ELSE
        RAISE NOTICE 'User already exists with ID: %', user_id;
    END IF;
    
    -- Create auth identity
    -- This is the bcrypt hash for password: Admin123!
    -- You should change this password after first login
    auth_id := 'authid_' || substr(md5(random()::text), 1, 21);
    
    INSERT INTO auth_identity (
        id,
        entity_id,
        provider,
        provider_metadata,
        created_at,
        updated_at
    ) VALUES (
        auth_id,
        user_id,
        'emailpass',
        '{"password": "$2a$10$M1.O/M3qUCTs5chRWUPxCODk3bUULraqPmDRPVNceNhLPqmcMIEOC"}',
        NOW(),
        NOW()
    ) ON CONFLICT (entity_id, provider) DO UPDATE
    SET provider_metadata = '{"password": "$2a$10$M1.O/M3qUCTs5chRWUPxCODk3bUULraqPmDRPVNceNhLPqmcMIEOC"}',
        updated_at = NOW();
    
    RAISE NOTICE 'Auth identity created/updated for user';
    RAISE NOTICE 'Admin user email: admin@dohhh.shop';
    RAISE NOTICE 'Default password: Admin123!';
    RAISE NOTICE 'Please change this password after first login!';
END $$;