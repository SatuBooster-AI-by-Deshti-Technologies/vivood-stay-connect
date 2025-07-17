import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NewClient() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/clients')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold">Новый клиент</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Информация о клиенте
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Имя</label>
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
              <label className="text-sm font-medium">Город</label>
              <Input placeholder="Алматы" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button>Добавить клиента</Button>
            <Button variant="outline" onClick={() => navigate('/admin/clients')}>
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}