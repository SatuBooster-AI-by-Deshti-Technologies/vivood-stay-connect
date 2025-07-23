import { StatsOverview } from './StatsOverview';
import { QuickActions } from './QuickActions';
import { TaskBoard } from './TaskBoard';
import { AccommodationAvailability } from './AccommodationAvailability';
import { NotificationSystem } from './NotificationSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Home, TrendingUp, CheckSquare, Activity, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function AdminDashboard() {
  const [activities, setActivities] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskManager, setShowTaskManager] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [activitiesData, tasksData] = await Promise.all([
        api.getActivities(),
        api.getTasks()
      ]);
      setActivities(activitiesData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Ошибка загрузки данных дашборда:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} д назад`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'client_added': return <Users className="w-4 h-4 text-green-600" />;
      case 'booking_created': return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'accommodation_updated': return <Home className="w-4 h-4 text-purple-600" />;
      case 'task_completed': return <CheckSquare className="w-4 h-4 text-green-600" />;
      case 'payment_received': return <span className="text-yellow-600">₸</span>;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const todayTasks = tasks.filter(task => {
    const today = new Date().toISOString().split('T')[0];
    return task.due_date === today || (task.status !== 'completed' && !task.due_date);
  });

  if (showTaskManager) {
    return <TaskBoard />;
  }

  return (
    <div className="p-3 md:p-6 space-y-6 md:space-y-8">
      <NotificationSystem />
      {/* Заголовок */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Vivood Tau</h1>
            <p className="text-gray-600">Добро пожаловать в панель управления</p>
          </div>
          <Badge variant="outline" className="text-base md:text-lg px-3 md:px-4 py-1 md:py-2 self-start">
            🏔️ Горный курорт
          </Badge>
        </div>
      </div>

      {/* Статистика */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Текущая статистика
        </h2>
        <StatsOverview />
      </div>

      {/* Быстрые действия, задачи и остатки мест */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <QuickActions />
        
        <AccommodationAvailability />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Сегодняшние задачи ({todayTasks.length})
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowTaskManager(true)}>
                <CheckSquare className="w-4 h-4 mr-1" />
                Управление
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : todayTasks.length === 0 ? (
              <div className="text-center py-6">
                <CheckSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Задач на сегодня нет</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' : 
                        task.priority === 'normal' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <span className="text-sm">{task.title}</span>
                    </div>
                    <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'}>
                      {task.priority === 'high' ? 'Приоритет' : 
                       task.priority === 'normal' ? 'Обычный' : 'Низкий'}
                    </Badge>
                  </div>
                ))}
                {todayTasks.length > 3 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => setShowTaskManager(true)}
                  >
                    Показать еще {todayTasks.length - 3} задач
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Последние активности */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Последние активности
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-6">
              <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Активности отсутствуют</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}