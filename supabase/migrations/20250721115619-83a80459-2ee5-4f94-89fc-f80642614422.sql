-- Обновление бронирований: автоматически создавать бухгалтерские записи при подтверждении
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
      '00000000-0000-0000-0000-000000000000'::uuid -- Системный пользователь
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создаем триггер для автоматического создания бухгалтерских записей
CREATE TRIGGER trigger_booking_accounting
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_booking_accounting_entry();

-- Добавляем проверку доступности размещений
CREATE OR REPLACE FUNCTION public.check_accommodation_availability(
  accommodation_name TEXT,
  check_in_date DATE,
  check_out_date DATE
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Проверяем, есть ли пересекающиеся подтвержденные бронирования
  RETURN NOT EXISTS (
    SELECT 1 
    FROM public.bookings 
    WHERE accommodation_type = accommodation_name 
      AND status = 'confirmed'
      AND (
        (check_in >= check_in_date AND check_in < check_out_date) OR
        (check_out > check_in_date AND check_out <= check_out_date) OR
        (check_in <= check_in_date AND check_out >= check_out_date)
      )
  );
END;
$$;