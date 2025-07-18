import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, ArrowLeft, User, Mail, Phone, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccommodationType {
  id: string;
  name_ru: string;
  price: number;
  is_active: boolean;
}

export function NewBooking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accommodations, setAccommodations] = useState<AccommodationType[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    accommodation_type: '',
    check_in: '',
    check_out: '',
    guests: 1,
    total_price: 0
  });

  useEffect(() => {
    loadAccommodations();
  }, []);

  const loadAccommodations = async () => {
    try {
      const { data, error } = await supabase
        .from('accommodation_types')
        .select('id, name_ru, price, is_active')
        .eq('is_active', true)
        .order('name_ru');

      if (error) {
        console.error('Error loading accommodations:', error);
        return;
      }

      setAccommodations(data || []);
    } catch (error) {
      console.error('Error loading accommodations:', error);
    }
  };

  const calculateTotal = () => {
    if (!formData.check_in || !formData.check_out || !formData.accommodation_type) return 0;
    
    const checkIn = new Date(formData.check_in);
    const checkOut = new Date(formData.check_out);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    const selectedAccommodation = accommodations.find(a => a.name_ru === formData.accommodation_type);
    if (!selectedAccommodation || nights <= 0) return 0;
    
    return nights * selectedAccommodation.price;
  };

  useEffect(() => {
    const total = calculateTotal();
    setFormData(prev => ({ ...prev, total_price: total }));
  }, [formData.check_in, formData.check_out, formData.accommodation_type, accommodations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .insert([{
          name: formData.name,
          email: `admin_${Date.now()}@vivoodtau.com`, // Автогенерация email для админа
          phone: formData.phone,
          accommodation_type: formData.accommodation_type,
          check_in: formData.check_in,
          check_out: formData.check_out,
          guests: formData.guests,
          total_price: formData.total_price,
          status: 'pending'
        }]);

      if (error) {
        console.error('Error creating booking:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось создать бронирование",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "Бронирование создано"
      });

      navigate('/admin/bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при создании бронирования",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/bookings')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold">Новое бронирование</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Информация о бронировании
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Информация о клиенте */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <User className="w-5 h-5 mr-2" />
                Данные клиента
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Имя клиента *</label>
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

            {/* Детали бронирования */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Детали размещения
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Тип размещения *</label>
                  <Select value={formData.accommodation_type} onValueChange={(value) => setFormData({...formData, accommodation_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип размещения" />
                    </SelectTrigger>
                    <SelectContent>
                      {accommodations.map((accommodation) => (
                        <SelectItem key={accommodation.id} value={accommodation.name_ru}>
                          {accommodation.name_ru} - {accommodation.price.toLocaleString()} ₸/ночь
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Количество гостей</label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={formData.guests}
                    onChange={(e) => setFormData({...formData, guests: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Дата заезда *</label>
                  <Input 
                    type="date" 
                    value={formData.check_in}
                    onChange={(e) => setFormData({...formData, check_in: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Дата выезда *</label>
                  <Input 
                    type="date" 
                    value={formData.check_out}
                    onChange={(e) => setFormData({...formData, check_out: e.target.value})}
                    min={formData.check_in || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Стоимость */}
            {formData.total_price > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-green-800 mb-2">Итоговая стоимость</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formData.total_price.toLocaleString()} ₸
                </p>
                <p className="text-sm text-green-700">
                  за {Math.ceil((new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / (1000 * 60 * 60 * 24))} ночей
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Создание...' : 'Создать бронирование'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/admin/bookings')}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}