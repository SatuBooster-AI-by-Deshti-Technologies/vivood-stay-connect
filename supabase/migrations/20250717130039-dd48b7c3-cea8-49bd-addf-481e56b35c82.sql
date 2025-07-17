-- Создаем таблицу клиентов
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  notes TEXT,
  source TEXT DEFAULT 'manual', -- manual, whatsapp, instagram, website
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу сообщений чатов
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- whatsapp, instagram, telegram
  message_type TEXT NOT NULL DEFAULT 'text', -- text, image, file, audio
  content TEXT NOT NULL,
  is_from_client BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB, -- дополнительная информация (ID сообщения в источнике, etc)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу сессий WhatsApp
CREATE TABLE public.whatsapp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name TEXT NOT NULL UNIQUE,
  qr_code TEXT, -- base64 QR код
  status TEXT NOT NULL DEFAULT 'disconnected', -- connected, disconnected, waiting
  phone_number TEXT,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу конфигурации Instagram
CREATE TABLE public.instagram_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT,
  business_account_id TEXT,
  webhook_verify_token TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_config ENABLE ROW LEVEL SECURITY;

-- Политики для админов
CREATE POLICY "Админы могут управлять клиентами" ON public.clients FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Админы могут управлять сообщениями" ON public.chat_messages FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Админы могут управлять WhatsApp сессиями" ON public.whatsapp_sessions FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Админы могут управлять Instagram конфигом" ON public.instagram_config FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Индексы для производительности
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_phone ON public.clients(phone);
CREATE INDEX idx_chat_messages_client_id ON public.chat_messages(client_id);
CREATE INDEX idx_chat_messages_source ON public.chat_messages(source);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Триггеры для updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_sessions_updated_at
  BEFORE UPDATE ON public.whatsapp_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instagram_config_updated_at
  BEFORE UPDATE ON public.instagram_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();