-- Fix booking table RLS policies for secure public booking creation
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Все могут создавать бронирования" ON public.bookings;

-- Create new policy that allows public booking creation with proper constraints
CREATE POLICY "Public can create bookings with required fields" 
ON public.bookings 
FOR INSERT 
WITH CHECK (
  -- All required fields must be present
  name IS NOT NULL 
  AND email IS NOT NULL 
  AND phone IS NOT NULL 
  AND accommodation_type IS NOT NULL 
  AND check_in IS NOT NULL 
  AND check_out IS NOT NULL 
  AND guests IS NOT NULL 
  AND guests > 0
  -- Ensure check_out is after check_in
  AND check_out > check_in
  -- Ensure booking dates are in the future
  AND check_in >= CURRENT_DATE
);

-- Ensure admins and managers can still view all bookings
DROP POLICY IF EXISTS "Админы и менеджеры могут просматривать" ON public.bookings;
CREATE POLICY "Admins and managers can view all bookings" 
ON public.bookings 
FOR SELECT 
USING (is_admin_or_manager());

-- Ensure admins and managers can update bookings
DROP POLICY IF EXISTS "Админы и менеджеры могут обновлять" ON public.bookings;
CREATE POLICY "Admins and managers can update bookings" 
ON public.bookings 
FOR UPDATE 
USING (is_admin_or_manager())
WITH CHECK (is_admin_or_manager());

-- Add policy for admins and managers to delete bookings
CREATE POLICY "Admins and managers can delete bookings" 
ON public.bookings 
FOR DELETE 
USING (is_admin_or_manager());