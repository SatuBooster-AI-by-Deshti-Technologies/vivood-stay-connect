import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Instagram, MessageCircle, Link } from 'lucide-react';

export function AdminInstagram() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Instagram интеграция</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Instagram className="w-5 h-5 mr-2" />
              Подключение аккаунта
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Имя пользователя</label>
              <Input placeholder="@your_hotel_account" />
            </div>
            <Button className="w-full">
              <Link className="w-4 h-4 mr-2" />
              Подключить Instagram
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Сообщения
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Подключите Instagram для получения сообщений от клиентов
            </p>
            <Button variant="outline" className="w-full" disabled>
              Настроить автоответы
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}