-- Fix critical security issue: Remove public access to financial accounts table

-- Drop the dangerous public policy that exposes financial data
DROP POLICY IF EXISTS "Все могут просматривать активные" ON public.accounts;

-- Ensure only admins can view accounts (this policy already exists but let's recreate it to be sure)
DROP POLICY IF EXISTS "Only admins can view accounts" ON public.accounts;

CREATE POLICY "Only admins can view accounts" 
ON public.accounts 
FOR SELECT 
TO authenticated
USING (public.is_admin());

-- The existing "Only admins can manage accounts" policy handles INSERT, UPDATE, DELETE
-- Let's ensure it's properly configured
DROP POLICY IF EXISTS "Only admins can manage accounts" ON public.accounts;

CREATE POLICY "Only admins can manage accounts" 
ON public.accounts 
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add an index for better performance when admins query accounts
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON public.accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_accounts_code ON public.accounts(code);

-- Revoke any direct permissions that might bypass RLS
REVOKE ALL ON public.accounts FROM anon;
REVOKE ALL ON public.accounts FROM authenticated;

-- Grant only the necessary permissions with RLS enforcement
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;

-- Ensure the is_admin function has proper security settings
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND app_role = 'admin'
  )
$$;

-- Add audit logging for account access (for security monitoring)
CREATE OR REPLACE FUNCTION public.log_account_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when sensitive financial data is accessed
  IF TG_OP = 'SELECT' THEN
    INSERT INTO public.activities (
      type,
      description,
      entity_type,
      entity_id,
      user_id
    ) VALUES (
      'account_access',
      'Financial account data accessed',
      'account',
      OLD.id,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Note: SELECT triggers are not supported in PostgreSQL, 
-- so we'll add a comment for manual audit implementation if needed
COMMENT ON TABLE public.accounts IS 'SECURITY: This table contains sensitive financial data. Access is restricted to admin users only. Consider implementing application-level audit logging for SELECT operations.';

-- Verify no other policies exist that could expose the data
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'accounts';
    
  IF policy_count > 2 THEN
    RAISE WARNING 'Additional policies detected on accounts table. Review for security.';
  END IF;
END $$;