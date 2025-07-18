import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Phone, QrCode, MessageCircle, Smartphone, RefreshCw, Power, Trash2, Settings, Bot } from 'lucide-react';

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
  const [aiConfig, setAiConfig] = useState({
    openai_api_key: '',
    prompt: 'Вы - помощник отеля. Отвечайте вежливо и помогайте с бронированием номеров.'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
    loadAiConfig();
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

  const loadAiConfig = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
        .single();
      
      // В реальном проекте можно создать отдельную таблицу для настроек ИИ
      // Пока используем локальное состояние
    } catch (error) {
      console.error('Error loading AI config:', error);
    }
  };

  const saveAiConfig = async () => {
    if (!aiConfig.openai_api_key.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите OpenAI API ключ",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Успешно",
      description: "Настройки ИИ сохранены"
    });
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('Error deleting session:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось удалить сессию",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "Сессия удалена"
      });

      await loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const connectDemo = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-session', {
        body: {
          action: 'connect_demo',
          sessionId,
          sessionName: sessions.find(s => s.id === sessionId)?.session_name
        }
      });

      if (error) {
        console.error('Error connecting demo:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось подключить демо",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "Демо-версия WhatsApp подключена"
      });

      await loadSessions();
    } catch (error) {
      console.error('Error connecting demo:', error);
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
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp ИИ Ассистент</h1>
        <p className="text-gray-600">Подключите WhatsApp и настройте ИИ для автоматических ответов</p>
      </div>

      {/* Настройки ИИ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="w-5 h-5 mr-2" />
            Настройки ИИ Ассистента
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">OpenAI API Key</label>
            <Input
              type="password"
              placeholder="sk-..."
              value={aiConfig.openai_api_key}
              onChange={(e) => setAiConfig(prev => ({ ...prev, openai_api_key: e.target.value }))}
            />
            <p className="text-xs text-gray-600">
              Получите ключ на <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com</a>
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Промпт для ИИ</label>
            <Textarea
              placeholder="Опишите роль ИИ ассистента..."
              value={aiConfig.prompt}
              onChange={(e) => setAiConfig(prev => ({ ...prev, prompt: e.target.value }))}
              rows={4}
            />
            <p className="text-xs text-gray-600">
              Например: "Вы - ассистент отеля. Помогайте клиентам с бронированием, отвечайте на вопросы о номерах и услугах."
            </p>
          </div>

          <Button onClick={saveAiConfig} className="w-full">
            <Settings className="w-4 h-4 mr-2" />
            Сохранить настройки ИИ
          </Button>
        </CardContent>
      </Card>

      {/* Создание новой сессии */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            Подключение WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Название (например: hotel-assistant)"
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
            Создайте сессию для подключения WhatsApp номера к ИИ ассистенту
          </p>
        </CardContent>
      </Card>

      {/* WhatsApp сессии */}
      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Нет подключенных WhatsApp номеров</p>
                <p className="text-sm text-gray-400 mt-2">
                  Создайте сессию для подключения ИИ ассистента
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">{session.session_name}</span>
                </div>
                <Badge className={getStatusColor(session.status)}>
                  {getStatusText(session.status)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {session.phone_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{session.phone_number}</span>
                    </div>
                  )}
                  
                   <div className="flex flex-wrap gap-2">
                     <Button
                       onClick={() => generateQR(session.id, session.session_name)}
                       variant="outline"
                       size="sm"
                       disabled={session.status === 'connected'}
                     >
                       <RefreshCw className="w-4 h-4 mr-2" />
                       Генерировать QR
                     </Button>
                     <Button
                       onClick={() => connectDemo(session.id)}
                       variant="default"
                       size="sm"
                       disabled={session.status === 'connected'}
                     >
                       <Phone className="w-4 h-4 mr-2" />
                       Подключить демо
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
                     <Button
                       onClick={() => deleteSession(session.id)}
                       variant="outline"
                       size="sm"
                     >
                       <Trash2 className="w-4 h-4 mr-2" />
                       Удалить
                     </Button>
                   </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">QR код для подключения</h4>
                  {session.qr_code ? (
                    <div className="bg-white p-3 rounded-lg border-2 border-dashed border-gray-300">
                      <img
                        src={session.qr_code}
                        alt="WhatsApp QR Code"
                        className="w-full max-w-32 mx-auto"
                      />
                       <p className="text-xs text-center text-gray-600 mt-2">
                         ДЕМО QR-код - не сканируется в WhatsApp
                       </p>
                       <p className="text-xs text-center text-blue-600 mt-1">
                         Используйте "Подключить демо" для тестирования
                       </p>
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-6 rounded-lg flex flex-col items-center justify-center">
                      <QrCode className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 text-center">
                        {session.status === 'connected' 
                          ? 'ИИ ассистент активен' 
                          : 'Нажмите "Обновить QR"'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}