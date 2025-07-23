-- Исправляем ограничение category для пустых значений
ALTER TABLE public.accommodation_types 
DROP CONSTRAINT IF EXISTS accommodation_types_category_check;

ALTER TABLE public.accommodation_types 
ADD CONSTRAINT accommodation_types_category_check 
CHECK (category IN ('VIP', 'СТАНДАРТ') OR category IS NULL OR category = '');

-- Исправляем функцию создания бухгалтерских записей - убираем ссылку на несуществующего пользователя
CREATE OR REPLACE FUNCTION public.create_booking_accounting_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Создаем дебетовую запись при подтверждении бронирования
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' AND NEW.total_price > 0 THEN
    INSERT INTO public.accounting_entries (
      date,
      description,
      debit_account,
      credit_account,
      amount,
      reference,
      created_by
    ) VALUES (
      CURRENT_DATE,
      'Подтвержденное бронирование: ' || NEW.name || ' (' || NEW.accommodation_type || ')',
      '1210', -- Дебиторская задолженность
      '7010', -- Доходы от размещения  
      NEW.total_price,
      'booking_' || NEW.id,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000001'::uuid) -- Используем текущего пользователя или запасной UUID
    );
  END IF;
  
  RETURN NEW;
END;
$$;