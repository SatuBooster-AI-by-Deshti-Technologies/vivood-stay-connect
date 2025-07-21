-- Add new admin user
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
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'vivoodtau@satubooster.kz',
  crypt('vivoodtau@satubooster.kz', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"VivoodTau Admin"}',
  'authenticated',
  'authenticated'
);

-- Create profile for the new admin user
INSERT INTO public.profiles (
  user_id,
  name,
  role
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'vivoodtau@satubooster.kz'),
  'VivoodTau Admin',
  'admin'
);