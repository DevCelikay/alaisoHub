-- =====================================================
-- Migration: Time-Series Campaign Analytics
-- Adds campaign_metrics_daily table for historical tracking
-- Safe to run - uses IF NOT EXISTS for idempotency
-- =====================================================

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

-- =====================================================
-- Indexes
-- =====================================================

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
-- RLS Policies
-- =====================================================
ALTER TABLE public.campaign_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean re-runs)
DROP POLICY IF EXISTS "Campaign metrics are viewable by authenticated users" ON public.campaign_metrics_daily;
DROP POLICY IF EXISTS "Only admins can manage campaign metrics" ON public.campaign_metrics_daily;
DROP POLICY IF EXISTS "Only admins can update campaign metrics" ON public.campaign_metrics_daily;

-- Authenticated users can view
CREATE POLICY "Campaign metrics are viewable by authenticated users"
  ON public.campaign_metrics_daily FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert
CREATE POLICY "Only admins can manage campaign metrics"
  ON public.campaign_metrics_daily FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Only admins can update
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
-- Verification Queries
-- Run these after migration to verify success
-- =====================================================

-- Check table was created
-- SELECT COUNT(*) FROM public.campaign_metrics_daily;

-- Check indexes exist
-- SELECT indexname FROM pg_indexes WHERE tablename = 'campaign_metrics_daily';

-- Check functions exist
-- SELECT proname FROM pg_proc WHERE proname IN ('upsert_campaign_metrics_daily', 'cleanup_old_campaign_metrics');

-- Check RLS policies
-- SELECT policyname FROM pg_policies WHERE tablename = 'campaign_metrics_daily';

-- =====================================================
-- End of Migration
-- =====================================================
