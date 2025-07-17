import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Mail, Phone, Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Client {
  email: string;
  name: string;
  phone: string;
  totalBookings: number;
  lastBooking: string;
}

export function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('name, email, phone, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading clients:', error);
        return;
      }

      // Группируем по email для получения уникальных клиентов
      const clientsMap = new Map<string, Client>();
      
      bookings?.forEach(booking => {
        const existing = clientsMap.get(booking.email);
        if (existing) {
          existing.totalBookings += 1;
          if (new Date(booking.created_at) > new Date(existing.lastBooking)) {
            existing.lastBooking = booking.created_at;
          }
        } else {
          clientsMap.set(booking.email, {
            email: booking.email,
            name: booking.name,
            phone: booking.phone,
            totalBookings: 1,
            lastBooking: booking.created_at
          });
        }
      });

      setClients(Array.from(clientsMap.values()));
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">База клиентов</h1>
        <Button onClick={() => navigate('/admin/clients/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить клиента
        </Button>
      </div>

      <div className="grid gap-4">
        {clients.map((client, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{client.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {client.phone}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {client.totalBookings} бронирований
                  </p>
                  <p className="text-sm text-gray-600">
                    Последнее: {new Date(client.lastBooking).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}