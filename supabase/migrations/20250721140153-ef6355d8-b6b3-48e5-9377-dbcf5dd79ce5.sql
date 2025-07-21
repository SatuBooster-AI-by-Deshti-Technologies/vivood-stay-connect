-- Обновляем роль пользователя на admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'vivoodtau@satubooster.kz'
);