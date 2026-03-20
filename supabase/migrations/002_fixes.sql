-- ============================================================
-- WebLogistica — Migration 002: Schema Fixes
-- Fixes: status constraint, subdomain columns, missing tables,
--        missing storage bucket, missing RLS policies
-- Run this migration in Supabase SQL Editor AFTER 001
-- ============================================================

-- ── 1. Fix shipments status CHECK constraint ─────────────────
-- Drop old constraint and add new one with all statuses used by code
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_status_check;

ALTER TABLE public.shipments ADD CONSTRAINT shipments_status_check
  CHECK (status IN (
    'quoted',
    'pending_payment',
    'paid',
    'label_created',
    'labels_generated',
    'in_transit',
    'delivered',
    'manual_intervention_required',
    'cancelled'
  ));

-- ── 2. Fix subdomains table ─────────────────────────────────
-- Add 'domain' column (used by get-rates.ts) and 'markup_percentage' alias
-- The original table uses 'name' and 'specific_markup'
-- We add the new columns and sync them

ALTER TABLE public.subdomains ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE public.subdomains ADD COLUMN IF NOT EXISTS markup_percentage NUMERIC(5,2);

-- Sync existing data: copy 'name' to 'domain' and 'specific_markup' to 'markup_percentage'
UPDATE public.subdomains SET domain = name WHERE domain IS NULL;
UPDATE public.subdomains SET markup_percentage = specific_markup WHERE markup_percentage IS NULL;

-- Create trigger to keep them in sync on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.sync_subdomain_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- If domain is set but name is not, sync name from domain
  IF NEW.domain IS NOT NULL AND NEW.name IS NULL THEN
    NEW.name := NEW.domain;
  END IF;
  -- If name is set but domain is not, sync domain from name
  IF NEW.name IS NOT NULL AND NEW.domain IS NULL THEN
    NEW.domain := NEW.name;
  END IF;
  -- If markup_percentage is set but specific_markup is not, sync
  IF NEW.markup_percentage IS NOT NULL AND NEW.specific_markup = 0 THEN
    NEW.specific_markup := NEW.markup_percentage;
  END IF;
  -- If specific_markup is set but markup_percentage is not, sync
  IF NEW.specific_markup IS NOT NULL AND NEW.markup_percentage IS NULL THEN
    NEW.markup_percentage := NEW.specific_markup;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_subdomain_columns_trigger ON public.subdomains;
CREATE TRIGGER sync_subdomain_columns_trigger
  BEFORE INSERT OR UPDATE ON public.subdomains
  FOR EACH ROW EXECUTE FUNCTION public.sync_subdomain_columns();

-- Update existing seed data
UPDATE public.subdomains SET domain = name, markup_percentage = specific_markup WHERE name = 'venezuela';

-- ── 3. Create chat_history table ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  source TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access chat_history" ON public.chat_history
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_chat_history_session ON public.chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created ON public.chat_history(created_at DESC);

-- ── 4. Create support_logs table ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL DEFAULT 'web',
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  ai_response TEXT,
  shipment_id UUID,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.support_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access support_logs" ON public.support_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_support_logs_sender ON public.support_logs(sender_id);
CREATE INDEX IF NOT EXISTS idx_support_logs_channel ON public.support_logs(channel);
CREATE INDEX IF NOT EXISTS idx_support_logs_created ON public.support_logs(created_at DESC);

-- ── 5. Create shipping_labels storage bucket ─────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('shipping_labels', 'shipping_labels', true)
ON CONFLICT (id) DO NOTHING;

-- ── 6. Add RLS DELETE policy for shipments ───────────────────
CREATE POLICY "Users delete own shipments" ON public.shipments
  FOR DELETE USING (
    auth.uid() = user_id
    AND status IN ('pending_payment', 'quoted')
  );

-- ── 7. Add shipments columns used by checkout.ts ─────────────
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS origin_postal_code TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS origin_country TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS destination_postal_code TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS destination_country TEXT;
