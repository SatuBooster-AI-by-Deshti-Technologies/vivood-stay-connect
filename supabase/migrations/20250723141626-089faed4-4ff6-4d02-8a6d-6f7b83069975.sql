-- Включаем realtime для таблицы bookings
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Также включаем для accommodation_types чтобы отслеживать изменения остатков
ALTER TABLE public.accommodation_types REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accommodation_types;