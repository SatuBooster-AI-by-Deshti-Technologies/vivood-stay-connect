import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, AlertTriangle } from 'lucide-react';

interface AccommodationType {
  id: string;
  name_ru: string;
  category: string;
  total_quantity: number;
  available_quantity: number;
  is_active: boolean;
}

export function AccommodationAvailability() {
  const [accommodations, setAccommodations] = useState<AccommodationType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccommodations();
  }, []);

  const loadAccommodations = async () => {
    try {
      const { data, error } = await supabase
        .from('accommodation_types')
        .select('id, name_ru, category, total_quantity, available_quantity, is_active')
        .eq('is_active', true)
        .order('name_ru');

      if (error) {
        console.error('Error loading accommodations:', error);
        return;
      }

      setAccommodations(data || []);
    } catch (error) {
      console.error('Error loading accommodations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Home className="w-5 h-5 mr-2" />
            Остатки мест
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const lowStockAccommodations = accommodations.filter(acc => acc.available_quantity <= 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Home className="w-5 h-5 mr-2" />
            Остатки мест
          </div>
          {lowStockAccommodations.length > 0 && (
            <Badge variant="destructive" className="flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {lowStockAccommodations.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {accommodations.length === 0 ? (
          <div className="text-center py-6">
            <Home className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Нет активных размещений</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accommodations.map((accommodation) => (
              <div 
                key={accommodation.id} 
                className={`p-4 rounded-lg border ${
                  accommodation.available_quantity === 0 
                    ? 'bg-red-50 border-red-200' 
                    : accommodation.available_quantity <= 2 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{accommodation.name_ru}</h4>
                      {accommodation.category && (
                        <Badge 
                          variant={accommodation.category === 'VIP' ? 'default' : 'outline'}
                          className={`text-xs ${accommodation.category === 'VIP' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
                        >
                          {accommodation.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      Всего: {accommodation.total_quantity} | 
                      Свободно: {accommodation.available_quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      accommodation.available_quantity === 0 
                        ? 'text-red-600' 
                        : accommodation.available_quantity <= 2 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                    }`}>
                      {accommodation.available_quantity}
                    </div>
                    <div className="text-xs text-gray-500">
                      {accommodation.available_quantity === 0 
                        ? 'ЗАНЯТО' 
                        : accommodation.available_quantity <= 2 
                        ? 'МАЛО' 
                        : 'ОК'
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}