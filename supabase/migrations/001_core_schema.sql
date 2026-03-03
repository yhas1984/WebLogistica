-- ============================================================
-- WebLogistica — Core Database Schema
-- Run this migration in Supabase SQL Editor
-- ============================================================

-- ── Shipments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT,
  origin_data JSONB NOT NULL DEFAULT '{}',
  destination_data JSONB NOT NULL DEFAULT '{}',
  dimensions JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'quoted'
    CHECK (status IN ('quoted','paid','label_created','in_transit','delivered','cancelled')),
  api_provider TEXT
    CHECK (api_provider IS NULL OR api_provider IN ('shippo','packlink','genei')),
  carrier_name TEXT,
  service_name TEXT,
  cost_price NUMERIC(10,2),
  final_price NUMERIC(10,2),
  label_url TEXT,
  stripe_payment_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Subdomains ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subdomains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  theme_config JSONB DEFAULT '{}',
  specific_markup NUMERIC(5,2) DEFAULT 0,
  customs_fields JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── User Profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  default_address JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_shipments_user ON public.shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_subdomains_name ON public.subdomains(name);

-- ── RLS (Row Level Security) ───────────────────────────────
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subdomains ENABLE ROW LEVEL SECURITY;

-- Shipments: users see/create/update own
CREATE POLICY "Users see own shipments" ON public.shipments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own shipments" ON public.shipments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own shipments" ON public.shipments
  FOR UPDATE USING (auth.uid() = user_id);

-- Profiles: users manage own
CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Subdomains: anyone reads active
CREATE POLICY "Anyone reads active subdomains" ON public.subdomains
  FOR SELECT USING (active = true);

-- ── Auto-create profile on signup ──────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Seed: Venezuela subdomain ──────────────────────────────
INSERT INTO public.subdomains (name, display_name, theme_config, specific_markup, customs_fields)
VALUES (
  'venezuela',
  'Envíos a Venezuela desde España',
  '{"primaryColor": "#FCBF49", "heroText": "Envíos a casa desde España", "heroSubtext": "Envía paquetes a Venezuela con las mejores tarifas", "backgroundGradient": "from-yellow-600 to-red-600"}',
  2.50,
  '[{"field": "rif", "label": "RIF (Registro de Información Fiscal)", "required": true, "placeholder": "V-12345678-9"}]'
)
ON CONFLICT (name) DO NOTHING;
