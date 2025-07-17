-- Удаляем старые политики для profiles
DROP POLICY IF EXISTS "Пользователи могут создавать свой" ON public.profiles;
DROP POLICY IF EXISTS "Пользователи могут просматривать" ON public.profiles;
DROP POLICY IF EXISTS "Пользователи могут обновлять свой" ON public.profiles;

-- Создаем новые политики для profiles
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_admin());