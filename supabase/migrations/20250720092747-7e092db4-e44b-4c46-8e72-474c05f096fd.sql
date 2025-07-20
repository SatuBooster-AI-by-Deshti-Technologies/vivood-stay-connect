-- Создание первого админа
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Создаем запись в auth.users (это упрощенная версия, в реальности auth управляется Supabase)
    -- Вместо этого создадим профиль админа напрямую с фиксированным ID
    
    -- Создаем профиль админа с роль admin
    INSERT INTO public.profiles (user_id, name, role) 
    VALUES (
        '00000000-0000-0000-0000-000000000001'::uuid,
        'Супер Админ',
        'admin'
    ) ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    
    -- Также обновляем все существующие профили без роли
    UPDATE public.profiles SET role = 'admin' WHERE role IS NULL OR role = '';
    
END $$;