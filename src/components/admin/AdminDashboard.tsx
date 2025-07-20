import { StatsOverview } from './StatsOverview';
import { QuickActions } from './QuickActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Home, TrendingUp } from 'lucide-react';

export function AdminDashboard() {
  return (
    <div className="p-6 space-y-8">
      {/* Заголовок */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vivood Tau</h1>
            <p className="text-gray-600">Добро пожаловать в панель управления</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
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

      {/* Быстрые действия и уведомления */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Сегодняшние задачи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Проверить заезды на сегодня</span>
                </div>
                <Badge variant="outline">Приоритет</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Подготовить домики к заселению</span>
                </div>
                <Badge variant="secondary">Обычный</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Обновить информацию о номерах</span>
                </div>
                <Badge variant="outline">Низкий</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Последние активности */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Последние активности
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Новый клиент добавлен</p>
                <p className="text-xs text-gray-500">5 минут назад</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Новое бронирование получено</p>
                <p className="text-xs text-gray-500">15 минут назад</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Home className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Домик обновлен</p>
                <p className="text-xs text-gray-500">1 час назад</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}