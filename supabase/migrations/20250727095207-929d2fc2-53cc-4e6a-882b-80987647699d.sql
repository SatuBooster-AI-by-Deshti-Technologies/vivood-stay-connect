-- Удаляем все записи о клиентах
DELETE FROM public.clients;

-- Удаляем все записи о бронированиях  
DELETE FROM public.bookings;

-- Удаляем связанные данные WhatsApp
DELETE FROM public.whatsapp_sessions;
DELETE FROM public.whatsapp_messages;

-- Удаляем платежные ссылки
DELETE FROM public.payment_links;

-- Удаляем активности
DELETE FROM public.activities;

-- Удаляем бухгалтерские записи
DELETE FROM public.accounting_entries;