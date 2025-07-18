import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Plus, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images, onImagesChange, maxImages = 5 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('accommodation-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('accommodation-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображение",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (images.length >= maxImages) {
      toast({
        title: "Лимит изображений",
        description: `Максимум ${maxImages} изображений`,
        variant: "destructive"
      });
      return;
    }

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      onImagesChange([...images, imageUrl]);
      toast({
        title: "Успешно",
        description: "Изображение загружено"
      });
    }
  };

  const handleUrlAdd = () => {
    const urlInput = document.getElementById('image-url-input') as HTMLInputElement;
    const url = urlInput?.value.trim();
    
    if (!url) {
      toast({
        title: "Ошибка",
        description: "Введите URL изображения",
        variant: "destructive"
      });
      return;
    }

    if (images.length >= maxImages) {
      toast({
        title: "Лимит изображений",
        description: `Максимум ${maxImages} изображений`,
        variant: "destructive"
      });
      return;
    }

    if (images.includes(url)) {
      toast({
        title: "Ошибка",
        description: "Это изображение уже добавлено",
        variant: "destructive"
      });
      return;
    }

    onImagesChange([...images, url]);
    urlInput.value = '';
    toast({
      title: "Успешно",
      description: "Изображение добавлено"
    });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {images.map((imageUrl, index) => (
          <div key={index} className="relative group">
            <div className="w-24 h-24 border rounded-lg overflow-hidden bg-gray-50">
              <img 
                src={imageUrl} 
                alt={`Изображение ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04IDlIMTZWMTVIOFY5WiIgZmlsbD0iI0Q0RDREOCIvPgo8L3N2Zz4K';
                }}
              />
            </div>
            <Button
              onClick={() => removeImage(index)}
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
            <div className="text-center">
              <ImageIcon className="h-6 w-6 mx-auto text-gray-400" />
              <span className="text-xs text-gray-500 mt-1">Добавить</span>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          id="image-url-input"
          placeholder="Или введите URL изображения..."
          className="flex-1"
        />
        <Button 
          onClick={handleUrlAdd}
          variant="outline"
          disabled={images.length >= maxImages}
        >
          <Plus className="h-4 w-4 mr-1" />
          Добавить
        </Button>
      </div>

      <p className="text-sm text-gray-500">
        {images.length} из {maxImages} изображений. 
        {uploading && " Загрузка..."}
      </p>
    </div>
  );
}