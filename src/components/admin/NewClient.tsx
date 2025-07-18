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
    email: '',
    phone: '',
    notes: '',
    source: 'manual',
    vip_status: 'regular',
    nationality: '',
    birth_date: '',
    id_number: '',
    company: '',
    special_requirements: '',
    preferred_language: 'ru'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('clients')
        .insert([formData]);

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <label className="text-sm font-medium">Email *</label>
                  <Input 
                    type="email" 
                    placeholder="ivan@example.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                <div>
                  <label className="text-sm font-medium">Дата рождения</label>
                  <Input 
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Номер документа</label>
                  <Input 
                    placeholder="123456789012" 
                    value={formData.id_number}
                    onChange={(e) => setFormData({...formData, id_number: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Национальность</label>
                  <Input 
                    placeholder="Казахстанец" 
                    value={formData.nationality}
                    onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Контактная информация */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Предпочтения и статус
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <label className="text-sm font-medium">VIP статус</label>
                  <Select value={formData.vip_status} onValueChange={(value) => setFormData({...formData, vip_status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Обычный</SelectItem>
                      <SelectItem value="premium">Премиум</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="platinum">Платинум</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Предпочитаемый язык</label>
                  <Select value={formData.preferred_language} onValueChange={(value) => setFormData({...formData, preferred_language: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите язык" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="kz">Казахский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Компания</label>
                  <Input 
                    placeholder="ТОО Компания" 
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Дополнительная информация */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Дополнительная информация
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Особые требования</label>
                  <Textarea 
                    placeholder="Диетические ограничения, аллергии, предпочтения..."
                    value={formData.special_requirements}
                    onChange={(e) => setFormData({...formData, special_requirements: e.target.value})}
                    rows={3}
                  />
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