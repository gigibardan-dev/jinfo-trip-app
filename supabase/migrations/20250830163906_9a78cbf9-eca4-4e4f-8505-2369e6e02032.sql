-- Create demo admin user
INSERT INTO auth.users (
  id,
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
  '46d5027b-7290-4f17-adae-49121039b720',
  '00000000-0000-0000-0000-000000000000',
  'admin@travelpro.ro',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nume": "Admin", "prenume": "TravelPro", "role": "admin"}',
  false,
  'authenticated'
);

-- Create demo tourist user
INSERT INTO auth.users (
  id,
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
  gen_random_uuid(),
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
);

-- Update existing admin profile
UPDATE public.profiles 
SET nume = 'Admin', prenume = 'TravelPro' 
WHERE id = '46d5027b-7290-4f17-adae-49121039b720';