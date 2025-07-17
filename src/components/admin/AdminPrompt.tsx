import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Send, Phone, MessageCircle } from 'lucide-react';

interface WhatsAppSession {
  id: string;
  session_name: string;
  status: string;
  phone_number?: string;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  source: string;
}

export function AdminPrompt() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [customPhone, setCustomPhone] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
    loadClients();
  }, []);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('status', 'connected')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedSession) {
      toast({
        title: "Ошибка",
        description: "Выберите активную сессию WhatsApp",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите сообщение",
        variant: "destructive"
      });
      return;
    }

    let phoneNumber = customPhone;
    if (!phoneNumber && selectedClient) {
      const client = clients.find(c => c.id === selectedClient);
      phoneNumber = client?.phone || '';
    }

    if (!phoneNumber) {
      toast({
        title: "Ошибка",
        description: "Выберите клиента или введите номер телефона",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('whatsapp-session', {
        body: {
          action: 'send_message',
          sessionId: selectedSession,
          message: message.trim(),
          toNumber: phoneNumber
        }
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Сообщение отправлено через WhatsApp"
      });

      setMessage('');
      setCustomPhone('');
      setSelectedClient('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getConnectedSessions = () => {
    return sessions.filter(s => s.status === 'connected');
  };

  const connectedSessions = getConnectedSessions();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Отправка сообщений WhatsApp</h1>
        <p className="text-gray-600">Отправляйте сообщения клиентам через WhatsApp</p>
      </div>

      {connectedSessions.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Нет подключенных сессий WhatsApp</p>
              <p className="text-sm text-gray-400 mt-2">
                Подключите WhatsApp аккаунт в разделе "WhatsApp" для отправки сообщений
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Отправить сообщение
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Выбор сессии */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp сессия
              </label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите активную сессию" />
                </SelectTrigger>
                <SelectContent>
                  {connectedSessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.session_name} ({session.phone_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Выбор получателя */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выбрать клиента
                </label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите клиента" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({client.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Или введите номер
                </label>
                <Input
                  placeholder="+7XXXXXXXXXX"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Текст сообщения */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Сообщение
              </label>
              <Textarea
                placeholder="Введите ваше сообщение..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {message.length}/1000 символов
              </p>
            </div>

            {/* Кнопка отправки */}
            <Button
              onClick={sendMessage}
              disabled={loading || !selectedSession || !message.trim()}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Отправляется...' : 'Отправить сообщение'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}