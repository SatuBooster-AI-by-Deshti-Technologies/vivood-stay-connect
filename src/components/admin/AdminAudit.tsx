import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, AlertCircle } from 'lucide-react';

export function AdminAudit() {
  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Аудит системы</h1>
          <p className="text-gray-600">Функция аудита была удалена для упрощения системы</p>
        </div>
      </div>

      {/* Уведомление */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-amber-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            Аудит отключен
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800">
              Функция аудита базы данных была отключена для упрощения системы и повышения производительности. 
              Если вам необходим аудит, обратитесь к администратору системы.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Альтернативы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Альтернативы для отслеживания изменений
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Журнал активности</h4>
                <p className="text-sm text-gray-600">
                  Основные действия пользователей записываются в журнал активности на главной странице
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">История изменений</h4>
                <p className="text-sm text-gray-600">
                  Дата создания и обновления записей автоматически отслеживается в каждой таблице
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium">Резервные копии</h4>
                <p className="text-sm text-gray-600">
                  Регулярные резервные копии базы данных обеспечивают восстановление данных при необходимости
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}