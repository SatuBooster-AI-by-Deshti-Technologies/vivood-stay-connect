import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Phone, Instagram, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  client_id: string;
  source: string;
  content: string;
  is_from_client: boolean;
  created_at: string;
  client?: {
    name: string;
    email: string;
  };
}

export function AdminChats() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          client:clients(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedClient) return;

    try {
      // Find client details
      const clientMessages = groupedMessages[selectedClient];
      if (!clientMessages || clientMessages.length === 0) return;
      
      const client = clientMessages[0].client;
      const isWhatsApp = clientMessages.some(msg => msg.source === 'whatsapp');

      // Save message to database first
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          client_id: selectedClient,
          content: newMessage.trim(),
          source: isWhatsApp ? 'whatsapp' : 'admin',
          is_from_client: false,
          message_type: 'text'
        }]);

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      // If it's a WhatsApp client, send through WhatsApp
      if (isWhatsApp) {
        try {
          // Get client phone number
          const { data: clientData } = await supabase
            .from('clients')
            .select('phone')
            .eq('id', selectedClient)
            .single();

          if (clientData?.phone) {
            // Find active WhatsApp session
            const { data: sessions } = await supabase
              .from('whatsapp_sessions')
              .select('id')
              .eq('status', 'connected')
              .limit(1);

            if (sessions && sessions.length > 0) {
              const sessionId = sessions[0].id;
              
              // Send through WhatsApp edge function
              const response = await supabase.functions.invoke('whatsapp-session', {
                body: {
                  action: 'send_message',
                  sessionId: sessionId,
                  message: newMessage.trim(),
                  toNumber: clientData.phone
                }
              });

              if (response.error) {
                console.error('WhatsApp send error:', response.error);
              }
            }
          }
        } catch (whatsappError) {
          console.error('WhatsApp send failed:', whatsappError);
        }
      }

      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const groupedMessages = messages.reduce((acc, message) => {
    const clientId = message.client_id;
    if (!acc[clientId]) {
      acc[clientId] = [];
    }
    acc[clientId].push(message);
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Объединенные чаты</h1>
        <p className="text-gray-600">Все сообщения из WhatsApp и Instagram в одном месте</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Активные чаты ({Object.keys(groupedMessages).length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(groupedMessages).length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Нет активных чатов</p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([clientId, clientMessages]) => {
                  const lastMessage = clientMessages[0];
                  const client = lastMessage.client;
                  
                  return (
                    <div 
                      key={clientId} 
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedClient === clientId ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedClient(clientId)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          {lastMessage.source === 'whatsapp' ? (
                            <Phone className="h-4 w-4 text-green-600" />
                          ) : (
                            <Instagram className="h-4 w-4 text-pink-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{client?.name || 'Неизвестный клиент'}</h4>
                          <p className="text-sm text-gray-600 truncate">{lastMessage.content}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(lastMessage.created_at).toLocaleTimeString()}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {clientMessages.length}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                {selectedClient ? 'Чат с клиентом' : 'Выберите чат'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedClient ? (
                <div className="space-y-4">
                  <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-3">
                    {groupedMessages[selectedClient]?.reverse().map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.is_from_client ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.is_from_client
                              ? 'bg-gray-100 text-gray-900'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.is_from_client ? 'text-gray-500' : 'text-blue-100'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Введите сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>Выберите чат из списка для начала общения</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}