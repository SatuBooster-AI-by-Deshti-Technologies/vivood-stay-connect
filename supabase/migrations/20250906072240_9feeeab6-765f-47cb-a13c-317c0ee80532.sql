-- Fix critical security issue: Financial records exposed to public
-- Remove the public SELECT policy that exposes financial data
DROP POLICY IF EXISTS "Все могут просматривать активные" ON public.accounts;

-- Create a secure policy that only allows admins to view accounts
-- This protects sensitive financial information
CREATE POLICY "Only admins can view accounts" 
ON public.accounts 
FOR SELECT 
USING (is_admin());

-- Verify admin-only management policy is still in place
-- This ensures only admins can perform all operations on accounts
DROP POLICY IF EXISTS "Админы могут управлять планом сче" ON public.accounts;
CREATE POLICY "Only admins can manage accounts" 
ON public.accounts 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());