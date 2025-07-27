-- Сбрасываем available_quantity для всех размещений до исходного значения total_quantity
UPDATE public.accommodation_types 
SET available_quantity = total_quantity 
WHERE available_quantity != total_quantity;