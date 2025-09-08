-- Fix security issue: Add validation for public booking creation
-- while maintaining the ability for anonymous users to book

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

-- Create a more secure policy that allows public bookings but with validation
CREATE POLICY "Public can create bookings with validation" 
ON public.bookings 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  -- Ensure essential fields are provided
  name IS NOT NULL AND 
  email IS NOT NULL AND 
  phone IS NOT NULL AND
  accommodation_type IS NOT NULL AND
  check_in IS NOT NULL AND
  check_out IS NOT NULL AND
  guests IS NOT NULL AND
  
  -- Validate data constraints
  guests > 0 AND 
  guests <= 10 AND -- Max 10 guests per booking
  check_in >= CURRENT_DATE AND -- Can't book in the past
  check_out > check_in AND -- Check-out must be after check-in
  (check_out - check_in) <= 30 AND -- Max 30 days booking
  
  -- Email format validation (basic check)
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  
  -- Phone format validation (allows various formats)
  length(phone) >= 10 AND
  length(phone) <= 20 AND
  
  -- Name length validation
  length(name) >= 2 AND
  length(name) <= 100 AND
  
  -- Status must be pending for new bookings
  (status IS NULL OR status = 'pending')
);

-- Create a function for rate limiting bookings per IP/session
CREATE OR REPLACE FUNCTION public.check_booking_rate_limit(
  client_email text,
  client_phone text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this email or phone has made more than 3 bookings in the last hour
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE (email = client_email OR phone = client_phone)
      AND created_at > (NOW() - INTERVAL '1 hour')
    GROUP BY email, phone
    HAVING COUNT(*) >= 3
  );
END;
$$;

-- Add a constraint to prevent duplicate bookings (same accommodation, overlapping dates)
CREATE OR REPLACE FUNCTION public.prevent_double_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for overlapping confirmed bookings
  IF EXISTS (
    SELECT 1 
    FROM public.bookings 
    WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND accommodation_type = NEW.accommodation_type 
      AND status = 'confirmed'
      AND (
        (NEW.check_in >= check_in AND NEW.check_in < check_out) OR
        (NEW.check_out > check_in AND NEW.check_out <= check_out) OR
        (NEW.check_in <= check_in AND NEW.check_out >= check_out)
      )
  ) THEN
    RAISE EXCEPTION 'This accommodation is already booked for the selected dates';
  END IF;
  
  -- Check rate limiting
  IF NOT check_booking_rate_limit(NEW.email, NEW.phone) THEN
    RAISE EXCEPTION 'Too many booking attempts. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for double booking prevention
DROP TRIGGER IF EXISTS prevent_double_booking_trigger ON public.bookings;
CREATE TRIGGER prevent_double_booking_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_double_booking();

-- Add indexes for better performance on validation queries
CREATE INDEX IF NOT EXISTS idx_bookings_email ON public.bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON public.bookings(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_accommodation_status ON public.bookings(accommodation_type, status);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_booking_rate_limit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_double_booking TO anon, authenticated;