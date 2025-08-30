-- Create a demo tourist profile (will be linked when user signs up)
INSERT INTO public.profiles (id, email, nume, prenume, role)
VALUES (
    'b8d4a8e2-3c4d-4e5f-6789-abcdef123456', 
    'tourist@travelpro.ro', 
    'Tourist', 
    'Demo', 
    'tourist'
) ON CONFLICT (id) DO NOTHING;