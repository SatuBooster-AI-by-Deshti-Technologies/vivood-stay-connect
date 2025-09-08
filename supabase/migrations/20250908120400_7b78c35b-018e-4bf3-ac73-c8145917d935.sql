-- Исправление ошибки с правами на создание бронирования
-- Упрощаем политику, чтобы она работала корректно

-- Удаляем старую сложную политику
DROP POLICY IF EXISTS "Public can create bookings with validation" ON public.bookings;

-- Создаем более простую политику, которая разрешает создание бронирований
CREATE POLICY "Anyone can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (
  -- Базовая проверка обязательных полей
  name IS NOT NULL AND 
  email IS NOT NULL AND 
  phone IS NOT NULL AND
  accommodation_type IS NOT NULL AND
  check_in IS NOT NULL AND
  check_out IS NOT NULL AND
  guests IS NOT NULL AND
  guests > 0 AND
  check_in >= CURRENT_DATE AND
  check_out > check_in
);

-- Упрощаем функцию проверки лимитов
CREATE OR REPLACE FUNCTION public.check_booking_rate_limit(
  client_email text,
  client_phone text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Увеличиваем лимит до 10 бронирований в час
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE (email = client_email OR phone = client_phone)
      AND created_at > (NOW() - INTERVAL '1 hour')
    GROUP BY email, phone
    HAVING COUNT(*) >= 10
  );
END;
$$;

-- Упрощаем триггер для предотвращения двойного бронирования
CREATE OR REPLACE FUNCTION public.prevent_double_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Проверяем только подтвержденные бронирования
  IF NEW.status = 'confirmed' THEN
    IF EXISTS (
      SELECT 1 
      FROM public.bookings 
      WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND accommodation_type = NEW.accommodation_type 
        AND status = 'confirmed'
        AND (
          (NEW.check_in >= check_in AND NEW.check_in < check_out) OR
          (NEW.check_out > check_in AND NEW.check_out <= check_out) OR
          (NEW.check_in <= check_in AND NEW.check_out >= check_out)
        )
    ) THEN
      RAISE EXCEPTION 'Это жилье уже забронировано на выбранные даты';
    END IF;
  END IF;
  
  -- Проверка лимитов только для новых записей
  IF TG_OP = 'INSERT' THEN
    IF NOT check_booking_rate_limit(NEW.email, NEW.phone) THEN
      RAISE EXCEPTION 'Слишком много попыток бронирования. Попробуйте позже.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Убеждаемся, что анонимные пользователи могут создавать бронирования
GRANT INSERT ON public.bookings TO anon;
GRANT SELECT ON public.bookings TO anon;
GRANT USAGE ON SCHEMA public TO anon;