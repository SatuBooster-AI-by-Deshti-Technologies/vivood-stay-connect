import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, Instagram } from 'lucide-react';

export function AdminChats() {
  const chats = [
    {
      id: 1,
      name: 'Анна Иванова',
      platform: 'whatsapp',
      lastMessage: 'Добро пожаловать! Мы ответим в ближайшее время.',
      time: '10:30',
      unread: 2
    },
    {
      id: 2,
      name: 'hotel_guest_123',
      platform: 'instagram',
      lastMessage: 'Здравствуйте! Хотел бы забронировать номер',
      time: '09:15',
      unread: 1
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Объединенные чаты</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Активные чаты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {chats.map((chat) => (
                <div key={chat.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      {chat.platform === 'whatsapp' ? (
                        <Phone className="h-4 w-4 text-green-600" />
                      ) : (
                        <Instagram className="h-4 w-4 text-pink-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{chat.name}</h4>
                      <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{chat.time}</p>
                    {chat.unread > 0 && (
                      <Badge variant="default" className="mt-1">
                        {chat.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Чат
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-12">
                Выберите чат для начала общения
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}