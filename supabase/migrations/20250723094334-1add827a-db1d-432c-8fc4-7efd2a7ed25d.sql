-- Добавляем поля для классификации и количества домиков
ALTER TABLE public.accommodation_types 
ADD COLUMN category TEXT CHECK (category IN ('VIP', 'СТАНДАРТ') OR category IS NULL),
ADD COLUMN total_quantity INTEGER DEFAULT 1 CHECK (total_quantity > 0),
ADD COLUMN available_quantity INTEGER DEFAULT 1 CHECK (available_quantity >= 0);

-- Обновляем существующие записи
UPDATE public.accommodation_types 
SET total_quantity = 1, available_quantity = 1 
WHERE total_quantity IS NULL;

-- Добавляем триггер для автоматического обновления доступного количества при подтверждении бронирования
CREATE OR REPLACE FUNCTION public.update_accommodation_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- При подтверждении бронирования уменьшаем доступное количество
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE public.accommodation_types 
    SET available_quantity = available_quantity - 1
    WHERE name_ru = NEW.accommodation_type OR name_en = NEW.accommodation_type OR name_kz = NEW.accommodation_type;
  END IF;
  
  -- При отмене бронирования увеличиваем доступное количество
  IF NEW.status != 'confirmed' AND OLD.status = 'confirmed' THEN
    UPDATE public.accommodation_types 
    SET available_quantity = available_quantity + 1
    WHERE name_ru = NEW.accommodation_type OR name_en = NEW.accommodation_type OR name_kz = NEW.accommodation_type;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создаем триггер
CREATE TRIGGER trigger_accommodation_availability
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_accommodation_availability();