-- =====================================================
-- Incremental Migration - Only New Changes
-- Run this if you've already run the main migration
-- =====================================================

-- =====================================================
-- 1. Migrate steps table from sequence_id to campaign_id (if needed)
-- =====================================================
DO $$
BEGIN
  -- Check if steps table exists with sequence_id instead of campaign_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'steps' 
    AND column_name = 'sequence_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'steps' 
    AND column_name = 'campaign_id'
  ) THEN
    -- Add campaign_id column
    ALTER TABLE public.steps 
    ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE;
    
    -- Migrate data: get campaign_id from sequences table
    UPDATE public.steps s
    SET campaign_id = (
      SELECT campaign_id 
      FROM public.sequences seq 
      WHERE seq.id = s.sequence_id
    )
    WHERE s.sequence_id IS NOT NULL;
    
    -- Make campaign_id NOT NULL after migration
    ALTER TABLE public.steps 
    ALTER COLUMN campaign_id SET NOT NULL;
    
    -- Drop old sequence_id column
    ALTER TABLE public.steps 
    DROP COLUMN sequence_id CASCADE;
    
    -- Drop old foreign key constraint on sequence_id if it exists
    ALTER TABLE public.steps 
    DROP CONSTRAINT IF EXISTS steps_sequence_id_fkey;
  END IF;
END $$;

-- =====================================================
-- 2. Ensure steps table has correct unique constraint name
-- =====================================================
DO $$
BEGIN
  -- Drop old unique constraints if they exist
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'steps_campaign_id_step_number_variant_key'
    AND conrelid = 'public.steps'::regclass
  ) THEN
    ALTER TABLE public.steps 
    DROP CONSTRAINT steps_campaign_id_step_number_variant_key;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'steps_sequence_id_step_number_variant_key'
    AND conrelid = 'public.steps'::regclass
  ) THEN
    ALTER TABLE public.steps 
    DROP CONSTRAINT steps_sequence_id_step_number_variant_key;
  END IF;

  -- Add named unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'steps_campaign_step_variant_unique'
    AND conrelid = 'public.steps'::regclass
  ) THEN
    -- Check that campaign_id column exists before creating constraint
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'steps' 
      AND column_name = 'campaign_id'
    ) THEN
      ALTER TABLE public.steps 
      ADD CONSTRAINT steps_campaign_step_variant_unique 
      UNIQUE(campaign_id, step_number, variant);
    END IF;
  END IF;
END $$;

-- =====================================================
-- 2. Create or Replace upsert_step function
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
-- 3. Ensure updated_at trigger exists on steps
-- =====================================================
DROP TRIGGER IF EXISTS set_updated_at_steps ON public.steps;
CREATE TRIGGER set_updated_at_steps
  BEFORE UPDATE ON public.steps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- Done! The upsert_step function is now ready to use
-- =====================================================
