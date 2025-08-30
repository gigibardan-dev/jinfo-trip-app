-- Get the new tourist user ID to create profile
DO $$
DECLARE
    tourist_user_id UUID;
BEGIN
    -- Insert tourist user in auth
    INSERT INTO auth.users (
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        'tourist@travelpro.ro',
        crypt('tourist123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"nume": "Tourist", "prenume": "Demo", "role": "tourist"}',
        false,
        'authenticated'
    ) RETURNING id INTO tourist_user_id;

    -- Create profile for tourist
    INSERT INTO public.profiles (id, email, nume, prenume, role)
    VALUES (tourist_user_id, 'tourist@travelpro.ro', 'Tourist', 'Demo', 'tourist');
END $$;