-- =====================================================
-- Verification Script for Time-Series Analytics Schema
-- Run this script after deploying the schema to verify everything works
-- =====================================================

-- Step 1: Verify table exists
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campaign_metrics_daily'
ORDER BY ordinal_position;

-- Step 2: Verify indexes exist
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'campaign_metrics_daily';

-- Step 3: Verify unique constraint exists
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.campaign_metrics_daily'::regclass;

-- Step 4: Verify RLS policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'campaign_metrics_daily';

-- Step 5: Verify functions exist
SELECT
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('upsert_campaign_metrics_daily', 'cleanup_old_campaign_metrics');

-- =====================================================
-- Test the Schema
-- =====================================================

-- Test 1: Insert a test record using the upsert function
-- Replace '<your-campaign-uuid>' with an actual campaign ID from your campaigns table
DO $$
DECLARE
  test_campaign_id UUID;
  metric_id UUID;
BEGIN
  -- Get a real campaign ID from your database
  SELECT id INTO test_campaign_id
  FROM public.campaigns
  LIMIT 1;

  IF test_campaign_id IS NULL THEN
    RAISE NOTICE 'No campaigns found in database. Please create a campaign first.';
  ELSE
    -- Test upsert function
    SELECT upsert_campaign_metrics_daily(
      test_campaign_id,
      CURRENT_DATE,
      100, -- emails_sent
      10,  -- replies
      50,  -- opens
      5,   -- clicks
      3,   -- positive_replies
      200, -- leads_total
      100, -- leads_not_started
      NULL,-- sync_id
      '{"test": true}'::jsonb -- raw_data
    ) INTO metric_id;

    RAISE NOTICE 'Successfully created metric record with ID: %', metric_id;

    -- Verify record was created
    IF EXISTS (SELECT 1 FROM public.campaign_metrics_daily WHERE id = metric_id) THEN
      RAISE NOTICE 'Verification passed: Record exists in database';
    ELSE
      RAISE NOTICE 'Verification failed: Record not found';
    END IF;
  END IF;
END $$;

-- Test 2: Verify the test record
SELECT
  id,
  campaign_id,
  snapshot_date,
  emails_sent,
  replies,
  opens,
  clicks,
  positive_replies,
  leads_total,
  leads_not_started,
  recorded_at,
  created_at
FROM public.campaign_metrics_daily
ORDER BY created_at DESC
LIMIT 1;

-- Test 3: Test upsert behavior (should update existing record, not create duplicate)
DO $$
DECLARE
  test_campaign_id UUID;
  metric_id UUID;
BEGIN
  SELECT id INTO test_campaign_id
  FROM public.campaigns
  LIMIT 1;

  IF test_campaign_id IS NOT NULL THEN
    -- Upsert again with different values (same date)
    SELECT upsert_campaign_metrics_daily(
      test_campaign_id,
      CURRENT_DATE,
      150, -- updated emails_sent
      15,  -- updated replies
      75,  -- updated opens
      8,   -- updated clicks
      5,   -- updated positive_replies
      250, -- updated leads_total
      120, -- updated leads_not_started
      NULL,
      '{"test": true, "updated": true}'::jsonb
    ) INTO metric_id;

    RAISE NOTICE 'Upserted metric record with ID: %', metric_id;
  END IF;
END $$;

-- Test 4: Verify only one record exists for today (upsert should have updated, not duplicated)
SELECT
  COUNT(*) as record_count,
  snapshot_date
FROM public.campaign_metrics_daily
WHERE snapshot_date = CURRENT_DATE
GROUP BY snapshot_date;

-- Should return count of 1 per campaign, not 2

-- Test 5: Query last 30 days for a campaign
SELECT
  c.name as campaign_name,
  cmd.snapshot_date,
  cmd.emails_sent,
  cmd.replies,
  cmd.opens,
  CASE
    WHEN cmd.emails_sent > 0
    THEN ROUND((cmd.replies::decimal / cmd.emails_sent) * 100, 2)
    ELSE 0
  END as reply_rate_percent
FROM public.campaign_metrics_daily cmd
JOIN public.campaigns c ON c.id = cmd.campaign_id
WHERE cmd.snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY cmd.snapshot_date DESC
LIMIT 10;

-- Test 6: Test cleanup function (dry run - will delete test records)
-- Uncomment the line below to test cleanup
-- SELECT cleanup_old_campaign_metrics(365);

-- =====================================================
-- Cleanup Test Data
-- =====================================================

-- Uncomment to remove test records created during verification
-- DELETE FROM public.campaign_metrics_daily
-- WHERE snapshot_date = CURRENT_DATE
--   AND raw_data @> '{"test": true}';

-- =====================================================
-- Summary
-- =====================================================

SELECT
  'Verification Complete' as status,
  COUNT(*) as total_daily_metrics,
  COUNT(DISTINCT campaign_id) as campaigns_tracked,
  MIN(snapshot_date) as earliest_snapshot,
  MAX(snapshot_date) as latest_snapshot
FROM public.campaign_metrics_daily;
