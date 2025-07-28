-- First check if table exists, if not create it
CREATE TABLE IF NOT EXISTS accommodation_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name_kz text,
  name_ru text NOT NULL,
  name_en text,
  description_kz text,
  description_ru text,
  description_en text,
  price numeric NOT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert data
INSERT INTO accommodation_types (
  name_ru, name_en, description_ru, description_en, price, features
) VALUES 
('Эко-домик на 2 человека', 'Eco-house for 2 people',
'Уютный эко-домик в гармонии с природой на 2 человека',
'Cozy eco-house in harmony with nature for 2 people',
15000, '["Wi-Fi", "Частная ванная", "Мини-холодильник", "Система безопасности"]'),

('Люкс-вилла на 4 человека', 'Luxury villa for 4 people',
'Роскошная вилла со всеми удобствами на 4 человека',
'Luxury villa with all amenities for 4 people',
35000, '["Wi-Fi", "Частная ванная", "Полная кухня", "Частная терраса", "Система безопасности"]'),

('Семейный коттедж на 6 человек', 'Family cottage for 6 people',
'Просторный и комфортный коттедж для больших семей',
'Spacious and comfortable cottage for large families',
50000, '["Wi-Fi", "2 спальни", "Полная кухня", "Частный двор", "Детская зона"]'),

('Романтический домик на 2 человека', 'Romantic house for 2 people',
'Дом с романтической атмосферой для пар',
'House with romantic atmosphere for couples',
20000, '["Wi-Fi", "Частная джакузи", "Свечи", "Частная терраса", "Романтический декор"]');