-- Создание политик для storage bucket accommodation-images
-- Сначала удаляем существующие политики если есть
DROP POLICY IF EXISTS "Админы могут загружать изображения размещений" ON storage.objects;
DROP POLICY IF EXISTS "Все могут просматривать изображения размещений" ON storage.objects;

-- Создаем правильные политики для загрузки изображений
CREATE POLICY "Админы и менеджеры могут загружать изображения" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'accommodation-images' 
  AND is_admin_or_manager()
);

CREATE POLICY "Все могут просматривать изображения размещений" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'accommodation-images');

CREATE POLICY "Админы и менеджеры могут удалять изображения" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'accommodation-images' 
  AND is_admin_or_manager()
);

-- Проверим что пользователь имеет правильную роль в profiles
-- Обновим роль текущего пользователя на admin
UPDATE public.profiles 
SET app_role = 'admin'::app_role 
WHERE user_id = '52cf7ab5-c91e-4739-88fd-1f9390776207';