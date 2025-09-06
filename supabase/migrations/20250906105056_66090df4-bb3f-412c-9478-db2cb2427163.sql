-- Удаляем старую политику для создания бронирований
DROP POLICY IF EXISTS "Public can create bookings with required fields" ON public.bookings;

-- Создаем новую, более простую политику для публичных бронирований
CREATE POLICY "Anyone can create bookings" 
ON public.bookings 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Убедимся, что анонимные пользователи могут проверять доступность
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.accommodation_types TO anon;
GRANT SELECT ON public.bookings TO anon;
GRANT INSERT ON public.bookings TO anon;
GRANT EXECUTE ON FUNCTION public.check_accommodation_availability TO anon;