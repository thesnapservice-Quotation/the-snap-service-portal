-- ==============================================================================
-- The Snap Service Quotation Studio — Supabase / PostgreSQL Schema
-- ==============================================================================

-- 1. Create quotations table
CREATE TABLE IF NOT EXISTS public.quotations (
    id TEXT PRIMARY KEY,
    quotation_number TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'user-super-admin',
    status TEXT NOT NULL DEFAULT 'sent',
    client JSONB NOT NULL DEFAULT '{}'::jsonb,
    events JSONB NOT NULL DEFAULT '[]'::jsonb,
    inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    payment JSONB NOT NULL DEFAULT '{}'::jsonb,
    full_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for high-speed queries
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON public.quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_number ON public.quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_quotations_updated_at ON public.quotations(updated_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Allow read access
CREATE POLICY "Allow public read access" ON public.quotations
    FOR SELECT USING (true);

-- Allow full management access for authenticated/service role
CREATE POLICY "Allow full access for service role" ON public.quotations
    FOR ALL USING (true) WITH CHECK (true);
