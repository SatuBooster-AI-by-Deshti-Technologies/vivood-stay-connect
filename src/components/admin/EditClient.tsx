import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Save } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  notes?: string;
}

export function EditClient() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    if (id) {
      loadClient();
    }
  }, [id]);

  const loadClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading client:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные клиента",
          variant: "destructive"
        });
        navigate('/admin/clients');
        return;
      }

      setClient(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке",
        variant: "destructive"
      });
      navigate('/admin/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: client.name,
          email: client.email,
          phone: client.phone,
          source: client.source,
          notes: client.notes
        })
        .eq('id', client.id);

      if (error) {
        console.error('Error updating client:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось обновить данные клиента",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "Данные клиента обновлены"
      });

      navigate('/admin/clients');
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при обновлении",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  if (!client) {
    return <div className="p-6">Клиент не найден</div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/clients')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold">Редактирование клиента</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Данные клиента
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Имя клиента *</label>
                <Input 
                  placeholder="Иван Иванов" 
                  value={client.name}
                  onChange={(e) => setClient({...client, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email *</label>
                <Input 
                  type="email" 
                  placeholder="ivan@example.com" 
                  value={client.email}
                  onChange={(e) => setClient({...client, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Телефон *</label>
                <Input 
                  placeholder="+7 (777) 123-45-67" 
                  value={client.phone}
                  onChange={(e) => setClient({...client, phone: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Источник</label>
                <Select value={client.source} onValueChange={(value) => setClient({...client, source: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите источник" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Ручное добавление</SelectItem>
                    <SelectItem value="website">Сайт</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="phone">Телефон</SelectItem>
                    <SelectItem value="referral">Рекомендация</SelectItem>
                    <SelectItem value="booking">Бронирование</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Заметки</label>
              <Textarea 
                placeholder="Дополнительная информация о клиенте..."
                value={client.notes || ''}
                onChange={(e) => setClient({...client, notes: e.target.value})}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
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