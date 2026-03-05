// Script to create support_logs table via Supabase
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createSupportLogsTable() {
    // Use the SQL endpoint via fetch since supabase-js doesn't support raw DDL
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/`;

    // First, check if the table already exists by trying to query it
    const { error: checkError } = await supabase
        .from('support_logs')
        .select('id')
        .limit(1);

    if (!checkError) {
        console.log('✅ Table support_logs already exists');
        return;
    }

    if (checkError.code !== 'PGRST116' && checkError.message?.includes('does not exist') === false && checkError.code !== '42P01') {
        console.log('Table check result:', checkError.code, checkError.message);
    }

    // Create the table using the Management API
    const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('https://', '');
    const projectRef = dbUrl.split('.')[0];

    console.log('Project ref:', projectRef);
    console.log('Creating support_logs table...');

    // We'll create the migration script instead
    const migrationSQL = `
-- Create support_logs table for conversation history
CREATE TABLE IF NOT EXISTS public.support_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    message TEXT NOT NULL,
    ai_response TEXT,
    shipment_id UUID,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS
ALTER TABLE public.support_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for n8n)
CREATE POLICY "Service role full access" ON public.support_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_support_logs_sender ON public.support_logs(sender_id);
CREATE INDEX IF NOT EXISTS idx_support_logs_channel ON public.support_logs(channel);
CREATE INDEX IF NOT EXISTS idx_support_logs_created ON public.support_logs(created_at DESC);

-- Also ensure shipping_labels bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shipping_labels', 'shipping_labels', true)
ON CONFLICT (id) DO NOTHING;
    `;

    console.log('\n📝 Migration SQL to run in Supabase SQL Editor:\n');
    console.log(migrationSQL);
    console.log('\n⬆️  Copy and paste the above into: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
}

createSupportLogsTable().catch(console.error);
