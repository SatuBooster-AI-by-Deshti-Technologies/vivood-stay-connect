import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Home, Tag, Images } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageUploader } from './ImageUploader';

interface AccommodationType {
  id: string;
  name_ru: string;
  name_en: string;
  name_kz: string;
  description_ru: string;
  description_en: string;
  description_kz: string;
  price: number;
  features: string[];
  is_active: boolean;
  image_url: string;
  images: string[];
  created_at: string;
  category?: string;
  total_quantity: number;
  available_quantity: number;
}

export function AdminAccommodations() {
  const [accommodations, setAccommodations] = useState<AccommodationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccommodation, setEditingAccommodation] = useState<AccommodationType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name_ru: '',
    name_en: '',
    name_kz: '',
    description_ru: '',
    description_en: '',
    description_kz: '',
    price: 0,
    features: [] as string[],
    is_active: true,
    image_url: '',
    images: [] as string[],
    category: '',
    total_quantity: 1,
    available_quantity: 1
  });

  useEffect(() => {
    loadAccommodations();
  }, []);

  const loadAccommodations = async () => {
    try {
      const { data, error } = await supabase
        .from('accommodation_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading accommodations:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить размещения",
          variant: "destructive"
        });
        return;
      }

      setAccommodations(data || []);
    } catch (error) {
      console.error('Error loading accommodations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAccommodation) {
        // Обновление существующего размещения
        const { error } = await supabase
          .from('accommodation_types')
          .update(formData)
          .eq('id', editingAccommodation.id);

        if (error) {
          console.error('Error updating accommodation:', error);
          toast({
            title: "Ошибка",
            description: "Не удалось обновить размещение",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Успешно",
          description: "Размещение обновлено"
        });
      } else {
        // Создание нового размещения
        const { error } = await supabase
          .from('accommodation_types')
          .insert([formData]);

        if (error) {
          console.error('Error creating accommodation:', error);
          toast({
            title: "Ошибка",
            description: "Не удалось создать размещение",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Успешно",
          description: "Размещение создано"
        });
      }

      setIsDialogOpen(false);
      setEditingAccommodation(null);
      resetForm();
      await loadAccommodations();
    } catch (error) {
      console.error('Error saving accommodation:', error);
    }
  };

  const handleEdit = (accommodation: AccommodationType) => {
    setEditingAccommodation(accommodation);
    setFormData({
      name_ru: accommodation.name_ru,
      name_en: accommodation.name_en,
      name_kz: accommodation.name_kz,
      description_ru: accommodation.description_ru,
      description_en: accommodation.description_en,
      description_kz: accommodation.description_kz,
      price: accommodation.price,
      features: accommodation.features || [],
      is_active: accommodation.is_active,
      image_url: accommodation.image_url || '',
      images: accommodation.images || [],
      category: accommodation.category || '',
      total_quantity: accommodation.total_quantity || 1,
      available_quantity: accommodation.available_quantity || 1
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (accommodationId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это размещение?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('accommodation_types')
        .delete()
        .eq('id', accommodationId);

      if (error) {
        console.error('Error deleting accommodation:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось удалить размещение",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Успешно",
        description: "Размещение удалено"
      });

      await loadAccommodations();
    } catch (error) {
      console.error('Error deleting accommodation:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name_ru: '',
      name_en: '',
      name_kz: '',
      description_ru: '',
      description_en: '',
      description_kz: '',
      price: 0,
      features: [],
      is_active: true,
      image_url: '',
      images: [],
      category: '',
      total_quantity: 1,
      available_quantity: 1
    });
  };

  const handleNewAccommodation = () => {
    setEditingAccommodation(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleFeatureChange = (value: string) => {
    const features = value.split(',').map(f => f.trim()).filter(f => f);
    setFormData(prev => ({ ...prev, features }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление размещениями</h1>
          <p className="text-gray-600">Добавляйте и редактируйте типы размещений</p>
        </div>
        <Button onClick={handleNewAccommodation}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить размещение
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего размещений</p>
                <p className="text-2xl font-bold">{accommodations.length}</p>
              </div>
              <Home className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Активных</p>
                <p className="text-2xl font-bold text-green-600">
                  {accommodations.filter(a => a.is_active).length}
                </p>
              </div>
              <Home className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Средняя цена</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {accommodations.length > 0 
                    ? Math.round(accommodations.reduce((sum, a) => sum + a.price, 0) / accommodations.length).toLocaleString()
                    : 0} ₸
                </p>
              </div>
              <div className="text-yellow-600">₸</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список размещений */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accommodations.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8">
              <div className="text-center">
                <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Нет размещений</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          accommodations.map((accommodation) => (
            <Card key={accommodation.id} className="overflow-hidden">
              <div className="relative">
                {accommodation.images && accommodation.images.length > 0 ? (
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    <img 
                      src={accommodation.images[0]} 
                      alt={accommodation.name_ru}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden h-48 bg-gray-100 flex items-center justify-center">
                      <Home className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                ) : (
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <Home className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {accommodation.images && accommodation.images.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center">
                    <Images className="h-3 w-3 mr-1" />
                    {accommodation.images.length}
                  </div>
                )}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <Badge 
                    variant={accommodation.is_active ? 'default' : 'secondary'}
                  >
                    {accommodation.is_active ? 'Активно' : 'Неактивно'}
                  </Badge>
                  {accommodation.category && (
                    <Badge 
                      variant={accommodation.category === 'VIP' ? 'default' : 'outline'}
                      className={accommodation.category === 'VIP' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                    >
                      {accommodation.category}
                    </Badge>
                  )}
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{accommodation.name_ru}</CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {accommodation.description_ru}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-green-600 text-lg font-bold">₸</span>
                      <span className="text-xl font-bold text-green-600">
                        {accommodation.price.toLocaleString()} ₸
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">за ночь</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Всего домиков:</span>
                    <span className="font-medium">{accommodation.total_quantity}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Доступно:</span>
                    <span className={`font-medium ${accommodation.available_quantity === 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {accommodation.available_quantity}
                    </span>
                  </div>

                  {accommodation.features && accommodation.features.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Удобства:</p>
                      <div className="flex flex-wrap gap-1">
                        {accommodation.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {accommodation.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{accommodation.features.length - 3} еще
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => handleEdit(accommodation)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Изменить
                    </Button>
                    <Button 
                      onClick={() => handleDelete(accommodation.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Диалог создания/редактирования */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAccommodation ? 'Редактировать размещение' : 'Новое размещение'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name_ru">Название (RU)</Label>
                <Input
                  id="name_ru"
                  value={formData.name_ru}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name_en">Название (EN)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name_kz">Название (KZ)</Label>
                <Input
                  id="name_kz"
                  value={formData.name_kz}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_kz: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description_ru">Описание (RU)</Label>
              <Textarea
                id="description_ru"
                value={formData.description_ru}
                onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Цена за ночь (₸)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Категория</Label>
                <Select 
                  value={formData.category || "none"} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value === "none" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без категории</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="СТАНДАРТ">СТАНДАРТ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="total_quantity">Количество домиков</Label>
                <Input
                  id="total_quantity"
                  type="number"
                  min="1"
                  value={formData.total_quantity}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setFormData(prev => ({ 
                      ...prev, 
                      total_quantity: value,
                      available_quantity: Math.min(prev.available_quantity, value)
                    }));
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="features">Удобства (через запятую)</Label>
              <Input
                id="features"
                value={formData.features.join(', ')}
                onChange={(e) => handleFeatureChange(e.target.value)}
                placeholder="Wi-Fi, Кондиционер, Завтрак"
              />
            </div>

            <div>
              <Label htmlFor="images">Изображения домиков</Label>
              <ImageUploader 
                images={formData.images}
                onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
                maxImages={5}
              />
            </div>

            <div>
              <Label htmlFor="image_url">URL основного изображения (устаревшее)</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Активно</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit">
                {editingAccommodation ? 'Обновить' : 'Создать'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}