-- =====================================================
-- Alaiso Reporting Centre - Database Schema
-- Campaign Tracking, Analytics, and Variant Comparison
-- =====================================================

-- Enable UUID extension (should already exist)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: instantly_credentials
-- Store Instantly API keys (admin only)
-- =====================================================
CREATE TABLE public.instantly_credentials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  api_key TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.instantly_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage instantly credentials"
  ON public.instantly_credentials FOR ALL
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
-- Table: campaigns
-- Store synced campaigns from Instantly
-- =====================================================
CREATE TABLE public.campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  instantly_campaign_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT,
  auto_variant_select BOOLEAN DEFAULT false,
  daily_limit INTEGER,
  stop_on_reply BOOLEAN,
  link_tracking BOOLEAN,
  open_tracking BOOLEAN,
  raw_data JSONB NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaigns are viewable by authenticated users"
  ON public.campaigns FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

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

-- =====================================================
-- Table: campaign_sequences
-- Store email sequences (subject + body) from campaigns
-- =====================================================
CREATE TABLE public.campaign_sequences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, step_number)
);

ALTER TABLE public.campaign_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sequences are viewable by authenticated users"
  ON public.campaign_sequences FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage sequences"
  ON public.campaign_sequences FOR ALL
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
-- Table: campaign_analytics
-- Store analytics metrics from Instantly
-- =====================================================
CREATE TABLE public.campaign_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  leads_count INTEGER DEFAULT 0,
  contacted_count INTEGER DEFAULT 0,
  emails_sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  open_count_unique INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  reply_count_unique INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  link_click_count_unique INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  total_opportunities INTEGER DEFAULT 0,
  total_opportunity_value DECIMAL(10, 2) DEFAULT 0,
  open_rate DECIMAL(5, 2),
  reply_rate DECIMAL(5, 2),
  bounce_rate DECIMAL(5, 2),
  raw_data JSONB NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics are viewable by authenticated users"
  ON public.campaign_analytics FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage analytics"
  ON public.campaign_analytics FOR ALL
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
-- Table: variant_groups
-- User-defined variant comparison groups
-- =====================================================
CREATE TABLE public.variant_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.variant_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variant groups are viewable by authenticated users"
  ON public.variant_groups FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage variant groups"
  ON public.variant_groups FOR ALL
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
-- Table: campaign_variants
-- Link campaigns to variant groups (many-to-many)
-- =====================================================
CREATE TABLE public.campaign_variants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  variant_group_id UUID REFERENCES public.variant_groups(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  variant_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(variant_group_id, campaign_id)
);

ALTER TABLE public.campaign_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign variants are viewable by authenticated users"
  ON public.campaign_variants FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage campaign variants"
  ON public.campaign_variants FOR ALL
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
-- Table: sync_history
-- Track sync operations and errors
-- =====================================================
CREATE TABLE public.sync_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  campaigns_synced INTEGER DEFAULT 0,
  campaigns_failed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sync history is viewable by authenticated users"
  ON public.sync_history FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can create sync history"
  ON public.sync_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX idx_campaigns_instantly_id ON public.campaigns(instantly_campaign_id);
CREATE INDEX idx_campaigns_last_synced ON public.campaigns(last_synced_at DESC);
CREATE INDEX idx_campaign_sequences_campaign_id ON public.campaign_sequences(campaign_id);
CREATE INDEX idx_campaign_analytics_campaign_id ON public.campaign_analytics(campaign_id);
CREATE INDEX idx_campaign_analytics_synced_at ON public.campaign_analytics(synced_at DESC);
CREATE INDEX idx_variant_groups_created_at ON public.variant_groups(created_at DESC);
CREATE INDEX idx_campaign_variants_group_id ON public.campaign_variants(variant_group_id);
CREATE INDEX idx_campaign_variants_campaign_id ON public.campaign_variants(campaign_id);
CREATE INDEX idx_sync_history_started_at ON public.sync_history(started_at DESC);

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE TRIGGER set_updated_at_campaigns
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_variant_groups
  BEFORE UPDATE ON public.variant_groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_instantly_credentials
  BEFORE UPDATE ON public.instantly_credentials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- End of Schema
-- =====================================================
