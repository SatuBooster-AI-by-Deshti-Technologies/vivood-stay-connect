-- Добавляем поля для цен выходных и будних дней
ALTER TABLE accommodation_types 
ADD COLUMN weekday_price NUMERIC,
ADD COLUMN weekend_price NUMERIC;

-- Обновляем существующие записи, используя текущую цену как цену будних дней
UPDATE accommodation_types 
SET weekday_price = price,
    weekend_price = price * 1.3 -- выходные дороже на 30%
WHERE weekday_price IS NULL;

-- Делаем поля обязательными
ALTER TABLE accommodation_types 
ALTER COLUMN weekday_price SET NOT NULL,
ALTER COLUMN weekend_price SET NOT NULL;