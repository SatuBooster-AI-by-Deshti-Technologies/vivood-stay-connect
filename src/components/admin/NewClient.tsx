import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, ArrowLeft, User, Mail, Phone, MapPin, Star, Calendar, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function NewClient() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notes: '',
    source: 'manual'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('clients')
        .insert([{
          ...formData,
          email: `client_${Date.now()}@temp.local` // Auto-generate placeholder email
        }]);

      if (error) {
        console.error('Error creating client:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось создать клиента",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "Клиент добавлен в базу данных"
      });

      navigate('/admin/clients');
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при создании клиента",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/clients')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold">Новый клиент</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Информация о клиенте
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Основные данные */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <User className="w-5 h-5 mr-2" />
                Основные данные
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Полное имя *</label>
                  <Input 
                    placeholder="Иван Иванов" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Телефон *</label>
                  <Input 
                    placeholder="+7 (777) 123-45-67" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Дополнительная информация
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Источник</label>
                  <Select value={formData.source} onValueChange={(value) => setFormData({...formData, source: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите источник" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Ручное добавление</SelectItem>
                      <SelectItem value="website">Сайт</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="phone">Телефонный звонок</SelectItem>
                      <SelectItem value="referral">Рекомендация</SelectItem>
                      <SelectItem value="booking">Booking.com</SelectItem>
                      <SelectItem value="airbnb">Airbnb</SelectItem>
                      <SelectItem value="walk_in">Пришел самостоятельно</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Заметки</label>
                  <Textarea 
                    placeholder="Дополнительная информация о клиенте..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Добавление...' : 'Добавить клиента'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/admin/clients')}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}