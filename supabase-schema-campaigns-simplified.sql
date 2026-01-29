-- =====================================================
-- Simplified Campaign Schema
-- Campaigns, Sequences, and Steps with Analytics
-- =====================================================

-- Enable UUID extension (should already exist)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: instantly_credentials
-- Store Instantly API keys (admin only)
-- =====================================================
-- This table already exists, keeping it as-is

-- =====================================================
-- Table: campaigns
-- Store campaigns with basic info and aggregated analytics
-- =====================================================

-- First, migrate existing campaigns table
-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- Add credential_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'campaigns' 
    AND column_name = 'credential_id'
  ) THEN
    ALTER TABLE public.campaigns 
    ADD COLUMN credential_id UUID REFERENCES public.instantly_credentials(id);
  END IF;

  -- Add analytics columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'campaigns' 
    AND column_name = 'emails_sent'
  ) THEN
    ALTER TABLE public.campaigns 
    ADD COLUMN emails_sent INTEGER DEFAULT 0,
    ADD COLUMN replies INTEGER DEFAULT 0,
    ADD COLUMN opens INTEGER DEFAULT 0,
    ADD COLUMN clicks INTEGER DEFAULT 0,
    ADD COLUMN positive_replies INTEGER DEFAULT 0,
    ADD COLUMN leads_total INTEGER DEFAULT 0,
    ADD COLUMN leads_not_started INTEGER DEFAULT 0,
    ADD COLUMN reply_rate DECIMAL(5, 2),
    ADD COLUMN positive_rate DECIMAL(5, 2);
  END IF;

  -- Convert status from TEXT to INTEGER if it's currently TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'campaigns' 
    AND column_name = 'status'
    AND data_type = 'text'
  ) THEN
    -- Create a temporary column for the integer status
    ALTER TABLE public.campaigns ADD COLUMN status_new INTEGER;
    
    -- Convert status values to integers
    UPDATE public.campaigns 
    SET status_new = CASE 
      WHEN status::text ~ '^[0-9]+$' THEN status::text::INTEGER
      WHEN LOWER(status::text) = 'active' THEN 1
      WHEN LOWER(status::text) = 'paused' THEN 3
      ELSE NULL
    END;
    
    -- Drop old column and rename new one
    ALTER TABLE public.campaigns DROP COLUMN status;
    ALTER TABLE public.campaigns RENAME COLUMN status_new TO status;
  END IF;
  
  -- If status doesn't exist at all, add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'campaigns' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.campaigns ADD COLUMN status INTEGER;
  END IF;

  -- Remove old columns that are no longer needed (if they exist)
  ALTER TABLE public.campaigns 
    DROP COLUMN IF EXISTS auto_variant_select,
    DROP COLUMN IF EXISTS daily_limit,
    DROP COLUMN IF EXISTS stop_on_reply,
    DROP COLUMN IF EXISTS link_tracking,
    DROP COLUMN IF EXISTS open_tracking;
END $$;

-- Create table if it doesn't exist (for new installations)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  instantly_campaign_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  credential_id UUID REFERENCES public.instantly_credentials(id),
  status INTEGER, -- 1 = active, 3 = paused, etc.
  
  -- Basic Analytics (aggregated from all sequences/steps)
  emails_sent INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  positive_replies INTEGER DEFAULT 0,
  leads_total INTEGER DEFAULT 0,
  leads_not_started INTEGER DEFAULT 0,
  
  -- Optional calculated rates (can be computed in UI if preferred)
  reply_rate DECIMAL(5, 2),
  positive_rate DECIMAL(5, 2),
  
  -- Metadata
  raw_data JSONB, -- Store full API response for reference
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop old indexes if they exist
DROP INDEX IF EXISTS idx_campaigns_instantly_id;
DROP INDEX IF EXISTS idx_campaigns_last_synced;
DROP INDEX IF EXISTS idx_campaigns_credential_id;

-- Create indexes (after columns are added)
DO $$
BEGIN
  -- Create indexes if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'campaigns' 
    AND indexname = 'idx_campaigns_instantly_id'
  ) THEN
    CREATE INDEX idx_campaigns_instantly_id ON public.campaigns(instantly_campaign_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'campaigns' 
    AND indexname = 'idx_campaigns_last_synced'
  ) THEN
    CREATE INDEX idx_campaigns_last_synced ON public.campaigns(last_synced_at DESC);
  END IF;

  -- Only create credential_id index if the column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'campaigns' 
    AND column_name = 'credential_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'campaigns' 
    AND indexname = 'idx_campaigns_credential_id'
  ) THEN
    CREATE INDEX idx_campaigns_credential_id ON public.campaigns(credential_id) WHERE credential_id IS NOT NULL;
  END IF;
END $$;

-- =====================================================
-- Table: sequences
-- REMOVED: Only one sequence per campaign, so steps link directly to campaigns
-- =====================================================

-- =====================================================
-- Table: steps
-- Store individual steps with variants (1A, 1B, 2A, 2B, etc.)
-- Steps link directly to campaigns (since there's only one sequence per campaign)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  variant TEXT NOT NULL, -- 'A', 'B', 'C', etc.
  
  -- Email content
  subject TEXT,
  body_html TEXT,
  
  -- Step-level analytics (from Instantly API)
  sent INTEGER DEFAULT 0,
  opened INTEGER DEFAULT 0,
  unique_opened INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  unique_replies INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  opportunities INTEGER DEFAULT 0,
  unique_opportunities INTEGER DEFAULT 0,
  
  -- Metadata
  delay INTEGER, -- Delay in days before this step
  raw_data JSONB,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT steps_campaign_step_variant_unique UNIQUE(campaign_id, step_number, variant)
);

CREATE INDEX idx_steps_campaign_id ON public.steps(campaign_id);
CREATE INDEX idx_steps_step_variant ON public.steps(campaign_id, step_number, variant);

-- =====================================================
-- Function: Upsert Step
-- Handles upserting steps based on unique constraint
-- Preserves analytics when updating existing steps
-- =====================================================
CREATE OR REPLACE FUNCTION public.upsert_step(
  p_campaign_id UUID,
  p_step_number INTEGER,
  p_variant TEXT,
  p_subject TEXT,
  p_body_html TEXT,
  p_delay INTEGER,
  p_raw_data JSONB,
  p_last_synced_at TIMESTAMP WITH TIME ZONE,
  p_sent INTEGER DEFAULT NULL,
  p_opened INTEGER DEFAULT NULL,
  p_unique_opened INTEGER DEFAULT NULL,
  p_replies INTEGER DEFAULT NULL,
  p_unique_replies INTEGER DEFAULT NULL,
  p_clicks INTEGER DEFAULT NULL,
  p_unique_clicks INTEGER DEFAULT NULL,
  p_opportunities INTEGER DEFAULT NULL,
  p_unique_opportunities INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  step_id UUID;
BEGIN
  INSERT INTO public.steps (
    campaign_id,
    step_number,
    variant,
    subject,
    body_html,
    delay,
    raw_data,
    last_synced_at,
    sent,
    opened,
    unique_opened,
    replies,
    unique_replies,
    clicks,
    unique_clicks,
    opportunities,
    unique_opportunities
  ) VALUES (
    p_campaign_id,
    p_step_number,
    p_variant,
    p_subject,
    p_body_html,
    p_delay,
    p_raw_data,
    p_last_synced_at,
    COALESCE(p_sent, 0),
    COALESCE(p_opened, 0),
    COALESCE(p_unique_opened, 0),
    COALESCE(p_replies, 0),
    COALESCE(p_unique_replies, 0),
    COALESCE(p_clicks, 0),
    COALESCE(p_unique_clicks, 0),
    COALESCE(p_opportunities, 0),
    COALESCE(p_unique_opportunities, 0)
  )
  ON CONFLICT (campaign_id, step_number, variant)
  DO UPDATE SET
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    delay = EXCLUDED.delay,
    raw_data = EXCLUDED.raw_data,
    last_synced_at = EXCLUDED.last_synced_at,
    -- Only update analytics if provided, otherwise preserve existing values
    sent = COALESCE(EXCLUDED.sent, steps.sent),
    opened = COALESCE(EXCLUDED.opened, steps.opened),
    unique_opened = COALESCE(EXCLUDED.unique_opened, steps.unique_opened),
    replies = COALESCE(EXCLUDED.replies, steps.replies),
    unique_replies = COALESCE(EXCLUDED.unique_replies, steps.unique_replies),
    clicks = COALESCE(EXCLUDED.clicks, steps.clicks),
    unique_clicks = COALESCE(EXCLUDED.unique_clicks, steps.unique_clicks),
    opportunities = COALESCE(EXCLUDED.opportunities, steps.opportunities),
    unique_opportunities = COALESCE(EXCLUDED.unique_opportunities, steps.unique_opportunities),
    updated_at = NOW()
  RETURNING id INTO step_id;
  
  RETURN step_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Table: sync_history
-- Track sync operations and errors
-- =====================================================
-- This table already exists, keeping it as-is

-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Campaigns are viewable by authenticated users" ON public.campaigns;
CREATE POLICY "Campaigns are viewable by authenticated users"
  ON public.campaigns FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can manage campaigns" ON public.campaigns;
CREATE POLICY "Only admins can manage campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Only admins can update campaigns" ON public.campaigns;
CREATE POLICY "Only admins can update campaigns"
  ON public.campaigns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Sequences table removed - steps link directly to campaigns

-- Steps
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Steps are viewable by authenticated users"
  ON public.steps FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage steps"
  ON public.steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_campaigns ON public.campaigns;
CREATE TRIGGER set_updated_at_campaigns
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Sequences table removed

CREATE TRIGGER set_updated_at_steps
  BEFORE UPDATE ON public.steps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- Migration: Drop old tables (if they exist)
-- =====================================================
-- Drop old variant-related tables
DROP TABLE IF EXISTS public.campaign_variants CASCADE;
DROP TABLE IF EXISTS public.variant_groups CASCADE;

-- Drop old campaign_sequences table (replaced by steps)
DROP TABLE IF EXISTS public.campaign_sequences CASCADE;

-- Drop sequences table if it exists (no longer needed)
DROP TABLE IF EXISTS public.sequences CASCADE;

-- Drop old campaign_analytics table (analytics now in campaigns/sequences)
DROP TABLE IF EXISTS public.campaign_analytics CASCADE;

-- =====================================================
-- Table: campaign_metrics_daily
-- Store daily snapshots of campaign metrics for time-series analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS public.campaign_metrics_daily (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  snapshot_date DATE NOT NULL,

  -- Core Metrics (raw counts only - rates calculated dynamically in UI)
  emails_sent INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  positive_replies INTEGER DEFAULT 0,
  leads_total INTEGER DEFAULT 0,
  leads_not_started INTEGER DEFAULT 0,

  -- Metadata
  sync_id UUID REFERENCES public.sync_history(id) ON DELETE SET NULL,
  raw_data JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT campaign_metrics_daily_unique UNIQUE(campaign_id, snapshot_date)
);

-- Indexes for campaign_metrics_daily
-- Primary query: Get metrics for campaign over time
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_daily_campaign_date
  ON public.campaign_metrics_daily(campaign_id, snapshot_date DESC);

-- Query by date across all campaigns
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_daily_date
  ON public.campaign_metrics_daily(snapshot_date DESC);

-- Audit trail queries
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_daily_sync_id
  ON public.campaign_metrics_daily(sync_id)
  WHERE sync_id IS NOT NULL;

-- =====================================================
-- Function: Upsert Campaign Metrics Daily
-- Handles upserting daily snapshots based on unique constraint
-- Accepts NULL parameters to preserve existing values
-- =====================================================
CREATE OR REPLACE FUNCTION public.upsert_campaign_metrics_daily(
  p_campaign_id UUID,
  p_snapshot_date DATE,
  p_emails_sent INTEGER DEFAULT NULL,
  p_replies INTEGER DEFAULT NULL,
  p_opens INTEGER DEFAULT NULL,
  p_clicks INTEGER DEFAULT NULL,
  p_positive_replies INTEGER DEFAULT NULL,
  p_leads_total INTEGER DEFAULT NULL,
  p_leads_not_started INTEGER DEFAULT NULL,
  p_sync_id UUID DEFAULT NULL,
  p_raw_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  metric_id UUID;
BEGIN
  INSERT INTO public.campaign_metrics_daily (
    campaign_id,
    snapshot_date,
    emails_sent,
    replies,
    opens,
    clicks,
    positive_replies,
    leads_total,
    leads_not_started,
    sync_id,
    raw_data
  ) VALUES (
    p_campaign_id,
    p_snapshot_date,
    COALESCE(p_emails_sent, 0),
    COALESCE(p_replies, 0),
    COALESCE(p_opens, 0),
    COALESCE(p_clicks, 0),
    COALESCE(p_positive_replies, 0),
    COALESCE(p_leads_total, 0),
    COALESCE(p_leads_not_started, 0),
    p_sync_id,
    p_raw_data
  )
  ON CONFLICT (campaign_id, snapshot_date)
  DO UPDATE SET
    emails_sent = COALESCE(EXCLUDED.emails_sent, campaign_metrics_daily.emails_sent),
    replies = COALESCE(EXCLUDED.replies, campaign_metrics_daily.replies),
    opens = COALESCE(EXCLUDED.opens, campaign_metrics_daily.opens),
    clicks = COALESCE(EXCLUDED.clicks, campaign_metrics_daily.clicks),
    positive_replies = COALESCE(EXCLUDED.positive_replies, campaign_metrics_daily.positive_replies),
    leads_total = COALESCE(EXCLUDED.leads_total, campaign_metrics_daily.leads_total),
    leads_not_started = COALESCE(EXCLUDED.leads_not_started, campaign_metrics_daily.leads_not_started),
    sync_id = COALESCE(EXCLUDED.sync_id, campaign_metrics_daily.sync_id),
    raw_data = COALESCE(EXCLUDED.raw_data, campaign_metrics_daily.raw_data),
    recorded_at = NOW()
  RETURNING id INTO metric_id;

  RETURN metric_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Cleanup Old Campaign Metrics
-- Removes metrics older than specified retention period
-- =====================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_campaign_metrics(
  retention_days INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.campaign_metrics_daily
  WHERE snapshot_date < CURRENT_DATE - retention_days;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS Policies for campaign_metrics_daily
-- =====================================================
ALTER TABLE public.campaign_metrics_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Campaign metrics are viewable by authenticated users" ON public.campaign_metrics_daily;
CREATE POLICY "Campaign metrics are viewable by authenticated users"
  ON public.campaign_metrics_daily FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can manage campaign metrics" ON public.campaign_metrics_daily;
CREATE POLICY "Only admins can manage campaign metrics"
  ON public.campaign_metrics_daily FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Only admins can update campaign metrics" ON public.campaign_metrics_daily;
CREATE POLICY "Only admins can update campaign metrics"
  ON public.campaign_metrics_daily FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- =====================================================
-- End of Simplified Schema
-- =====================================================
