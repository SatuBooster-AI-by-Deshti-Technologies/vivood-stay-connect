-- Создаем таблицу типов размещений
CREATE TABLE public.accommodation_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_kz TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_kz TEXT,
  description_ru TEXT,
  description_en TEXT,
  price DECIMAL(10,2) NOT NULL,
  features TEXT[],
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу бронирований
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accommodation_type TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  total_price DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу профилей пользователей для админов
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Включаем RLS для всех таблиц
ALTER TABLE public.accommodation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Создаем функцию для проверки роли админа
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS политики для accommodation_types
CREATE POLICY "Все могут просматривать активные типы размещений" 
ON public.accommodation_types 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Админы могут управлять типами размещений" 
ON public.accommodation_types 
FOR ALL 
USING (public.is_admin());

-- RLS политики для bookings
CREATE POLICY "Все могут создавать бронирования" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Админы могут просматривать все бронирования" 
ON public.bookings 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Админы могут обновлять бронирования" 
ON public.bookings 
FOR UPDATE 
USING (public.is_admin());

-- RLS политики для profiles
CREATE POLICY "Пользователи могут просматривать свой профиль" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Пользователи могут создавать свой профиль" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Пользователи могут обновлять свой профиль" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

-- Создаем триггеры для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accommodation_types_updated_at
  BEFORE UPDATE ON public.accommodation_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Добавляем тестовые данные для типов размещений
INSERT INTO public.accommodation_types (name_kz, name_ru, name_en, description_kz, description_ru, description_en, price, features) VALUES
('Эко-юрта', 'Эко-юрта', 'Eco Yurt', 'Дәстүрлі юрта қазіргі ыңғайлылықпен', 'Традиционная юрта с современными удобствами', 'Traditional yurt with modern amenities', 15000.00, ARRAY['Wi-Fi', 'Кондиционер', 'Душ']),
('Глэмпинг шатыр', 'Глэмпинг палатка', 'Glamping Tent', 'Сапа көліктің ішінде кемпинг', 'Роскошный кемпинг в палатке', 'Luxury camping in a tent', 20000.00, ARRAY['Джакузи', 'Кухня', 'Террас']),
('Ағаш үй', 'Домик на дереве', 'Tree House', 'Ағаштың үстіндегі романтикалық үй', 'Романтический домик на дереве', 'Romantic tree house', 25000.00, ARRAY['Балкон', 'Камин', 'Сауна']);