-- Создание таблиц для полноценной работы приложения

-- Создание таблицы accounting_entries для учета
CREATE TABLE IF NOT EXISTS public.accounting_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  reference TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы accounts для плана счетов
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id UUID REFERENCES public.accounts(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы audit_logs для аудита
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включение RLS для всех таблиц
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Политики RLS для accounting_entries
CREATE POLICY "Админы могут управлять бухгалтерскими записями" 
ON public.accounting_entries 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- Политики RLS для accounts
CREATE POLICY "Админы могут управлять планом счетов" 
ON public.accounts 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Все могут просматривать активные счета" 
ON public.accounts 
FOR SELECT 
USING (is_active = true);

-- Политики RLS для audit_logs
CREATE POLICY "Админы могут просматривать аудит логи" 
ON public.audit_logs 
FOR SELECT 
USING (is_admin());

-- Триггеры для обновления updated_at
CREATE TRIGGER update_accounting_entries_updated_at
BEFORE UPDATE ON public.accounting_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Вставка базовых счетов
INSERT INTO public.accounts (code, name, account_type) VALUES
('1000', 'Касса', 'asset'),
('1010', 'Расчетный счет', 'asset'),
('1020', 'Дебиторская задолженность', 'asset'),
('2000', 'Кредиторская задолженность', 'liability'),
('3000', 'Уставный капитал', 'equity'),
('4000', 'Выручка от продаж', 'revenue'),
('5000', 'Себестоимость продаж', 'expense'),
('6000', 'Операционные расходы', 'expense')
ON CONFLICT (code) DO NOTHING;