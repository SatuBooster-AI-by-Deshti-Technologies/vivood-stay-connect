import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NewBooking() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/bookings')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold">Новое бронирование</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Информация о бронировании
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Имя клиента</label>
              <Input placeholder="Иван Иванов" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="ivan@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Телефон</label>
              <Input placeholder="+7 (777) 123-45-67" />
            </div>
            <div>
              <label className="text-sm font-medium">Количество гостей</label>
              <Input type="number" min="1" defaultValue="1" />
            </div>
            <div>
              <label className="text-sm font-medium">Дата заезда</label>
              <Input type="date" />
            </div>
            <div>
              <label className="text-sm font-medium">Дата выезда</label>
              <Input type="date" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button>Создать бронирование</Button>
            <Button variant="outline" onClick={() => navigate('/admin/bookings')}>
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}