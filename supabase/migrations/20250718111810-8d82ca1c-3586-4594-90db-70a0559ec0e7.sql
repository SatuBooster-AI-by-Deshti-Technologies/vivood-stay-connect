-- Create storage bucket for accommodation images
INSERT INTO storage.buckets (id, name, public) VALUES ('accommodation-images', 'accommodation-images', true);

-- Create storage policies for accommodation images
CREATE POLICY "Accommodation images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'accommodation-images');

CREATE POLICY "Admins can upload accommodation images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'accommodation-images' AND is_admin());

CREATE POLICY "Admins can update accommodation images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'accommodation-images' AND is_admin());

CREATE POLICY "Admins can delete accommodation images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'accommodation-images' AND is_admin());

-- Add multiple images support to accommodation_types
ALTER TABLE public.accommodation_types 
ADD COLUMN images TEXT[] DEFAULT '{}';

-- Update existing image_url data to images array
UPDATE public.accommodation_types 
SET images = CASE 
  WHEN image_url IS NOT NULL AND image_url != '' 
  THEN ARRAY[image_url] 
  ELSE '{}' 
END;