INSERT INTO public.profiles (user_id, name, role) 
VALUES ('ee088c75-5f20-425f-9007-8399d5131317', 'Admin User', 'admin')
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;