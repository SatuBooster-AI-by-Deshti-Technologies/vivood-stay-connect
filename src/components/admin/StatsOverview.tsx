import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, Home, TrendingUp, Clock } from 'lucide-react';

interface Stats {
  totalBookings: number;
  todayBookings: number;
  totalClients: number;
  activeAccommodations: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

export function StatsOverview() {
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    todayBookings: 0,
    totalClients: 0,
    activeAccommodations: 0,
    monthlyRevenue: 0,
    occupancyRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      // Загружаем статистику параллельно
      const [bookingsRes, clientsRes, accommodationsRes] = await Promise.all([
        supabase.from('bookings').select('*'),
        supabase.from('clients').select('id'),
        supabase.from('accommodation_types').select('*')
      ]);

      if (bookingsRes.error || clientsRes.error || accommodationsRes.error) {
        console.error('Error loading stats');
        return;
      }

      const bookings = bookingsRes.data || [];
      const clients = clientsRes.data || [];
      const accommodations = accommodationsRes.data || [];

      // Подсчет статистики
      const todayBookings = bookings.filter(b => b.check_in === today).length;
      const activeAccommodations = accommodations.filter(a => a.is_active).length;
      
      // Подсчет дохода за текущий месяц
      const monthlyBookings = bookings.filter(b => 
        b.check_in >= startOfMonth && b.status !== 'cancelled'
      );
      const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

      // Приблизительный расчет заполняемости (упрощенный)
      const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const totalPossibleBookings = activeAccommodations * totalDaysInMonth;
      const occupancyRate = totalPossibleBookings > 0 
        ? Math.round((monthlyBookings.length / totalPossibleBookings) * 100) 
        : 0;

      setStats({
        totalBookings: bookings.length,
        todayBookings,
        totalClients: clients.length,
        activeAccommodations,
        monthlyRevenue,
        occupancyRate: Math.min(occupancyRate, 100) // Ограничиваем 100%
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Заезды сегодня',
      value: stats.todayBookings,
      icon: CalendarDays,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      urgent: stats.todayBookings > 0
    },
    {
      title: 'Всего клиентов',
      value: stats.totalClients,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Активных домиков',
      value: stats.activeAccommodations,
      icon: Home,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Доход за месяц',
      value: `${stats.monthlyRevenue.toLocaleString()} ₸`,
      icon: () => <span className="text-xl">₸</span>,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Заполняемость',
      value: `${stats.occupancyRate}%`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Всего бронирований',
      value: stats.totalBookings,
      icon: Clock,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className={`relative ${stat.urgent ? 'ring-2 ring-blue-200' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.urgent && (
                  <Badge variant="default" className="mt-1">
                    Внимание!
                  </Badge>
                )}
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-3 rounded-full`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}