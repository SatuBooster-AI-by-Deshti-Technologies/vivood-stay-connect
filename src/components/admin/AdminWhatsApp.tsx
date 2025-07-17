import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, QrCode, MessageCircle } from 'lucide-react';

export function AdminWhatsApp() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">WhatsApp интеграция</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              QR код для WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-100 p-8 rounded-lg flex items-center justify-center">
              <QrCode className="w-32 h-32 text-gray-400" />
            </div>
            <Button className="w-full">
              Сгенерировать QR код
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Настройки чата
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Номер телефона</label>
              <Input placeholder="+7 (777) 123-45-67" />
            </div>
            <div>
              <label className="text-sm font-medium">Автоответ</label>
              <Input placeholder="Добро пожаловать! Мы ответим в ближайшее время." />
            </div>
            <Button className="w-full">
              Сохранить настройки
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}