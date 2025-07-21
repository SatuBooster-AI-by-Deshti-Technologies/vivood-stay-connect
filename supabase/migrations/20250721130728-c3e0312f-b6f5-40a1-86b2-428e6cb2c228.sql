-- Создание таблиц для WhatsApp интеграции

-- Таблица для WhatsApp сессий клиентов
CREATE TABLE public.whatsapp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  client_name TEXT,
  email TEXT,
  check_in_date DATE,
  check_out_date DATE,
  guests INTEGER,
  accommodation_type TEXT,
  total_price NUMERIC,
  session_stage TEXT NOT NULL DEFAULT 'initial', -- initial, collecting_info, booking_pending, booking_confirmed, payment_pending, payment_confirmed
  last_interaction TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  booking_id UUID REFERENCES public.bookings(id),
  client_id UUID REFERENCES public.clients(id),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  blocked_until TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица для истории WhatsApp сообщений
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.whatsapp_sessions(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL, -- text, audio, image, system
  content TEXT,
  is_from_client BOOLEAN NOT NULL DEFAULT true,
  ai_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица для маркетинговых кампаний
CREATE TABLE public.marketing_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  message_template TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'all', -- all, new_clients, returning_clients, pending_bookings
  send_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sent_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица для отправленных маркетинговых сообщений
CREATE TABLE public.marketing_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.whatsapp_sessions(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivery_status TEXT NOT NULL DEFAULT 'sent' -- sent, delivered, failed
);

-- Таблица для платежных ссылок и чеков
CREATE TABLE public.payment_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.whatsapp_sessions(id) ON DELETE CASCADE,
  payment_url TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT '₸',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, expired, cancelled
  payment_screenshot TEXT, -- base64 изображения чека
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

-- Политики RLS
CREATE POLICY "Админы могут управлять WhatsApp сессиями" 
ON public.whatsapp_sessions 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Админы могут управлять WhatsApp сообщениями" 
ON public.whatsapp_messages 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Админы могут управлять маркетинговыми кампаниями" 
ON public.marketing_campaigns 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Админы могут управлять маркетинговыми сообщениями" 
ON public.marketing_messages 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Админы могут управлять платежными ссылками" 
ON public.payment_links 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Триггеры для обновления updated_at
CREATE TRIGGER update_whatsapp_sessions_updated_at
BEFORE UPDATE ON public.whatsapp_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at
BEFORE UPDATE ON public.marketing_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_links_updated_at
BEFORE UPDATE ON public.payment_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Индексы для оптимизации
CREATE INDEX idx_whatsapp_sessions_phone ON public.whatsapp_sessions(phone_number);
CREATE INDEX idx_whatsapp_sessions_stage ON public.whatsapp_sessions(session_stage);
CREATE INDEX idx_whatsapp_sessions_last_interaction ON public.whatsapp_sessions(last_interaction);
CREATE INDEX idx_whatsapp_messages_session ON public.whatsapp_messages(session_id);
CREATE INDEX idx_payment_links_booking ON public.payment_links(booking_id);
CREATE INDEX idx_payment_links_status ON public.payment_links(status);