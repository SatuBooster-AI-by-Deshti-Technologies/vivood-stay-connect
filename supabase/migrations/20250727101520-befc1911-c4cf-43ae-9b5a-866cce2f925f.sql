-- Создаем enum для ролей
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

-- Добавляем колонку role в таблицу profiles
ALTER TABLE public.profiles 
ADD COLUMN app_role public.app_role DEFAULT 'user';

-- Обновляем существующих пользователей до admin роли
UPDATE public.profiles 
SET app_role = 'admin' 
WHERE role = 'admin';

-- Создаем функцию для проверки ролей (избегаем рекурсии RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND app_role = _role
  )
$$;

-- Создаем функцию для проверки, является ли пользователь админом или менеджером
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND app_role IN ('admin', 'manager')
  )
$$;

-- Обновляем функцию is_admin для использования новой роли
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND app_role = 'admin'
  )
$$;

-- Обновляем RLS политики для учета менеджеров
DROP POLICY IF EXISTS "Админы могут управлять типами раз" ON public.accommodation_types;
CREATE POLICY "Админы и менеджеры могут управлять типами размещений"
ON public.accommodation_types
FOR ALL
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Админы могут просматривать все бр" ON public.bookings;
CREATE POLICY "Админы и менеджеры могут просматривать все бронирования"
ON public.bookings
FOR SELECT
USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Админы могут обновлять бронирован" ON public.bookings;
CREATE POLICY "Админы и менеджеры могут обновлять бронирования"
ON public.bookings
FOR UPDATE
USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Админы могут управлять клиентами" ON public.clients;
CREATE POLICY "Админы и менеджеры могут управлять клиентами"
ON public.clients
FOR ALL
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Админы могут управлять задачами" ON public.tasks;
CREATE POLICY "Админы и менеджеры могут управлять задачами"
ON public.tasks
FOR ALL
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Админы могут управлять WhatsApp сесси" ON public.whatsapp_sessions;
CREATE POLICY "Админы и менеджеры могут управлять WhatsApp сессиями"
ON public.whatsapp_sessions
FOR ALL
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Админы могут управлять WhatsApp сообщ" ON public.whatsapp_messages;
CREATE POLICY "Админы и менеджеры могут управлять WhatsApp сообщениями"
ON public.whatsapp_messages
FOR ALL
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Админы могут управлять платежными" ON public.payment_links;
CREATE POLICY "Админы и менеджеры могут управлять платежными ссылками"
ON public.payment_links
FOR ALL
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Админы могут управлять маркетинго" ON public.marketing_campaigns;
CREATE POLICY "Админы и менеджеры могут управлять маркетинговыми кампаниями"
ON public.marketing_campaigns
FOR ALL
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Админы могут управлять маркетинго" ON public.marketing_messages;
CREATE POLICY "Админы и менеджеры могут управлять маркетинговыми сообщениями"
ON public.marketing_messages
FOR ALL
USING (public.is_admin_or_manager())
WITH CHECK (public.is_admin_or_manager());

-- Ограничиваем бухгалтерию и аудит только для админов
DROP POLICY IF EXISTS "Админы могут управлять бухгалтерс" ON public.accounting_entries;
CREATE POLICY "Только админы могут управлять бухгалтерскими записями"
ON public.accounting_entries
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Админы могут просматривать активн" ON public.activities;
CREATE POLICY "Админы и менеджеры могут просматривать активность"
ON public.activities
FOR SELECT
USING (public.is_admin_or_manager());

-- Обновляем политики для профилей
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Админы могут просматривать все профили"
ON public.profiles
FOR SELECT
USING (public.is_admin());

-- Менеджеры могут просматривать только свой профиль и профили обычных пользователей
CREATE POLICY "Менеджеры могут просматривать ограниченные профили"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'manager') 
  AND (user_id = auth.uid() OR app_role = 'user')
);

-- Только админы могут обновлять роли
CREATE POLICY "Только админы могут управлять ролями"
ON public.profiles
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());