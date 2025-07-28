-- Исправляем доступное количество, чтобы соответствовало общему количеству
UPDATE accommodation_types 
SET available_quantity = total_quantity 
WHERE is_active = true;