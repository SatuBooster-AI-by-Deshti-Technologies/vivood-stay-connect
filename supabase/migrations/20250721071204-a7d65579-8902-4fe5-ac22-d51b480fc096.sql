-- Создаем таблицу для задач
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date DATE,
  assigned_to UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для активностей
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('client_added', 'booking_created', 'accommodation_updated', 'task_completed', 'payment_received')),
  description TEXT NOT NULL,
  entity_id UUID,
  entity_type TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Политики для задач
CREATE POLICY "Админы могут управлять задачами"
  ON public.tasks
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Политики для активностей  
CREATE POLICY "Админы могут просматривать активности"
  ON public.activities
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Система может создавать активности"
  ON public.activities
  FOR INSERT
  WITH CHECK (true);

-- Триггеры для обновления updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Добавляем функцию для создания активности
CREATE OR REPLACE FUNCTION public.create_activity(
  activity_type TEXT,
  activity_description TEXT,
  entity_id UUID DEFAULT NULL,
  entity_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activities (type, description, entity_id, entity_type, user_id)
  VALUES (activity_type, activity_description, entity_id, entity_type, auth.uid())
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- Удаляем таблицу аудита и связанные политики
DROP TABLE IF EXISTS public.audit_logs CASCADE;