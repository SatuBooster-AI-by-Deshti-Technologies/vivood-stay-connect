import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Phone, QrCode, MessageCircle, Smartphone, RefreshCw, Power } from 'lucide-react';

interface WhatsAppSession {
  id: string;
  session_name: string;
  qr_code?: string;
  status: string;
  phone_number?: string;
  last_activity?: string;
  created_at: string;
}

export function AdminWhatsApp() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSessionName, setNewSessionName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading sessions:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить сессии WhatsApp",
          variant: "destructive"
        });
        return;
      }

      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    if (!newSessionName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название сессии",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-session', {
        body: {
          action: 'create',
          sessionName: newSessionName.trim()
        }
      });

      if (error) {
        console.error('Error creating session:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось создать сессию",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "Сессия WhatsApp создана"
      });

      setNewSessionName('');
      await loadSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при создании сессии",
        variant: "destructive"
      });
    }
  };

  const generateQR = async (sessionId: string, sessionName: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('whatsapp-session', {
        body: {
          action: 'generate_qr',
          sessionId,
          sessionName
        }
      });

      if (error) {
        console.error('Error generating QR:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось сгенерировать QR код",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "QR код сгенерирован. Ожидание подключения..."
      });

      // Start polling for status updates
      let pollCount = 0;
      const maxPolls = 30; // 60 seconds maximum
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        
        const { data: sessionData } = await supabase.functions.invoke('whatsapp-session', {
          body: {
            action: 'get_status',
            sessionId
          }
        });

        if (sessionData?.status === 'connected') {
          clearInterval(pollInterval);
          toast({
            title: "Подключено!",
            description: "WhatsApp успешно подключен"
          });
          await loadSessions();
        } else if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          toast({
            title: "Таймаут",
            description: "QR код не был отсканирован в течение 60 секунд",
            variant: "destructive"
          });
        } else {
          // Update sessions to show current QR
          await loadSessions();
        }
      }, 2000);

      await loadSessions();
    } catch (error) {
      console.error('Error generating QR:', error);
    } finally {
      setLoading(false);
    }
  };

  const disconnectSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-session', {
        body: {
          action: 'disconnect',
          sessionId
        }
      });

      if (error) {
        console.error('Error disconnecting session:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось отключить сессию",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "Сессия отключена"
      });

      await loadSessions();
    } catch (error) {
      console.error('Error disconnecting session:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Подключено';
      case 'waiting': return 'Ожидает QR';
      case 'disconnected': return 'Отключено';
      default: return status;
    }
  };

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp интеграция</h1>
        <p className="text-gray-600">Управление WhatsApp сессиями и чатами</p>
      </div>

      {/* Создание новой сессии */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            Новая сессия WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Название сессии (например: main-account)"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={createSession}>
              <Phone className="w-4 h-4 mr-2" />
              Создать сессию
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Создайте новую сессию для подключения WhatsApp аккаунта через QR код
          </p>
        </CardContent>
      </Card>

      {/* Список сессий */}
      <div className="grid gap-6">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Нет активных сессий WhatsApp</p>
                <p className="text-sm text-gray-400 mt-2">
                  Создайте сессию для начала работы
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {session.session_name}
                  </CardTitle>
                  <Badge className={getStatusColor(session.status)}>
                    {getStatusText(session.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Информация о сессии */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Информация</h3>
                      <div className="space-y-2 text-sm">
                        {session.phone_number && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{session.phone_number}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Создано:</span>
                          <span>{new Date(session.created_at).toLocaleString()}</span>
                        </div>
                        {session.last_activity && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Последняя активность:</span>
                            <span>{new Date(session.last_activity).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => generateQR(session.id, session.session_name)}
                        variant="outline"
                        size="sm"
                        disabled={session.status === 'connected'}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Обновить QR
                      </Button>
                      <Button
                        onClick={() => disconnectSession(session.id)}
                        variant="destructive"
                        size="sm"
                        disabled={session.status === 'disconnected'}
                      >
                        <Power className="w-4 h-4 mr-2" />
                        Отключить
                      </Button>
                    </div>
                  </div>

                  {/* QR код */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">QR код для подключения</h3>
                    {session.qr_code ? (
                      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                        <img
                          src={session.qr_code}
                          alt="WhatsApp QR Code"
                          className="w-full max-w-48 mx-auto"
                        />
                        <p className="text-xs text-center text-gray-600 mt-2">
                          Отсканируйте этот QR код в WhatsApp Web
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-8 rounded-lg flex flex-col items-center justify-center">
                        <QrCode className="w-16 h-16 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 text-center">
                          {session.status === 'connected' 
                            ? 'Сессия уже подключена' 
                            : 'QR код не сгенерирован'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}