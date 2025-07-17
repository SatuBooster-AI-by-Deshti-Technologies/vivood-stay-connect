import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { AdminRoutes } from "@/components/admin/AdminRoutes";
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Booking {
  id: string;
  accommodation_type: string;
  check_in: string;
  check_out: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

interface AccommodationType {
  id: string;
  name_ru: string;
  name_en: string;
  name_kz: string;
  description_ru: string;
  price: number;
  features: string[];
  is_active: boolean;
}

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [accommodations, setAccommodations] = useState<AccommodationType[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (profile?.role === 'admin') {
        setUser(session.user);
        loadData();
      } else {
        toast({
          title: "Доступ запрещен",
          description: "У вас нет прав администратора",
          variant: "destructive"
        });
      }
    }
    setLoading(false);
  };

  const loadData = async () => {
    // Загружаем бронирования
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (bookingsData) setBookings(bookingsData as Booking[]);

    // Загружаем типы размещений
    const { data: accommodationsData } = await supabase
      .from('accommodation_types')
      .select('*')
      .order('name_ru');
    
    if (accommodationsData) setAccommodations(accommodationsData);
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Успешно",
        description: "Статус бронирования обновлен"
      });
      loadData();
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Вход для администратора</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Пожалуйста, войдите с правами администратора для доступа к панели управления.
            </p>
            <Button 
              onClick={() => window.location.href = '/auth'} 
              className="w-full"
            >
              Войти
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Административная панель</h1>
          <Button onClick={signOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">
              <Calendar className="w-4 h-4 mr-2" />
              Бронирования
            </TabsTrigger>
            <TabsTrigger value="accommodations">
              <Home className="w-4 h-4 mr-2" />
              Размещения
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{booking.name}</h3>
                        <p className="text-muted-foreground">{booking.email} • {booking.phone}</p>
                      </div>
                      <Badge variant={
                        booking.status === 'confirmed' ? 'default' : 
                        booking.status === 'cancelled' ? 'destructive' : 'secondary'
                      }>
                        {booking.status === 'pending' ? 'Ожидает' : 
                         booking.status === 'confirmed' ? 'Подтвержден' : 'Отменен'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Размещение</p>
                        <p className="font-medium">{booking.accommodation_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Заезд</p>
                        <p className="font-medium">{new Date(booking.check_in).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Выезд</p>
                        <p className="font-medium">{new Date(booking.check_out).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Гостей</p>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span className="font-medium">{booking.guests}</span>
                        </div>
                      </div>
                    </div>

                    {booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          size="sm"
                        >
                          Подтвердить
                        </Button>
                        <Button 
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          variant="destructive" 
                          size="sm"
                        >
                          Отменить
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="accommodations" className="space-y-4">
            <div className="grid gap-4">
              {accommodations.map((accommodation) => (
                <Card key={accommodation.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{accommodation.name_ru}</h3>
                        <p className="text-muted-foreground">{accommodation.description_ru}</p>
                      </div>
                      <Badge variant={accommodation.is_active ? 'default' : 'secondary'}>
                        {accommodation.is_active ? 'Активно' : 'Неактивно'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Цена за ночь</p>
                        <p className="font-medium text-xl">{accommodation.price.toLocaleString()} ₸</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Удобства</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {accommodation.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}