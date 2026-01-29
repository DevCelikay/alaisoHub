# Time-Series Campaign Analytics - Quick Start Guide

## What Was Implemented

A new `campaign_metrics_daily` table that stores daily snapshots of campaign metrics, enabling:
- Trend analysis over time
- Historical comparisons
- Performance tracking
- Anomaly detection

## Files Modified

1. **supabase-schema-campaigns-simplified.sql** - Added time-series table, indexes, functions, and RLS policies
2. **lib/types/campaigns.ts** - Added TypeScript interfaces for time-series data
3. **N8N_SYNC_GUIDE.md** - Added documentation for daily snapshot integration
4. **verify-time-series-schema.sql** - Verification script (NEW)
5. **TIME_SERIES_QUICKSTART.md** - This guide (NEW)

## Database Schema

### Table: campaign_metrics_daily

Stores one snapshot per campaign per day.

**Key Fields:**
- `campaign_id` - Links to campaigns table
- `snapshot_date` - Date of snapshot (YYYY-MM-DD)
- Metrics: `emails_sent`, `replies`, `opens`, `clicks`, `positive_replies`, `leads_total`, `leads_not_started`
- `sync_id` - Optional link to sync_history
- `raw_data` - Full API response (JSONB)
- `recorded_at` - Timestamp of last update
- `created_at` - Timestamp of creation

**Unique Constraint:** `(campaign_id, snapshot_date)` - One snapshot per campaign per day

### Functions

1. **upsert_campaign_metrics_daily()** - Upserts daily snapshots
   - Accepts NULL parameters (preserves existing values)
   - Updates `recorded_at` on each upsert
   - Returns metric record ID

2. **cleanup_old_campaign_metrics(retention_days)** - Removes old metrics
   - Default: 365 days retention
   - Returns count of deleted records

## Deployment Steps

### 1. Deploy Schema Changes

Run the SQL migration in Supabase SQL Editor:

```sql
-- Open migration-time-series-analytics.sql
-- Copy the entire file content
-- Paste into Supabase SQL Editor
-- Run the script
```

The migration is:
- **Standalone** - Only adds time-series tables, doesn't modify existing schema
- **Idempotent** - Safe to run multiple times (uses IF NOT EXISTS)
- **Clean** - Drops and recreates policies to avoid conflicts

### 2. Verify Deployment

Run the verification script:

```sql
-- Open verify-time-series-schema.sql
-- Copy the entire file content
-- Paste into Supabase SQL Editor
-- Run the script
```

This will:
- Check table structure
- Verify indexes and constraints
- Test RLS policies
- Create test records
- Verify upsert behavior

### 3. Update n8n Workflow

Add a new step after syncing campaign analytics:

**Code Node - Prepare Daily Snapshot:**

```javascript
// Get current date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// Map Instantly API metrics to schema fields
const dailySnapshot = {
  campaign_id: items[0].json.campaign_id, // UUID from campaigns table
  snapshot_date: today,
  emails_sent: items[0].json.emails_sent_count,
  replies: items[0].json.reply_count_unique,
  opens: items[0].json.open_count_unique,
  clicks: items[0].json.link_click_count_unique,
  positive_replies: items[0].json.total_interested || 0,
  leads_total: items[0].json.leads_count,
  leads_not_started: items[0].json.leads_count - items[0].json.contacted_count,
  sync_id: items[0].json.sync_id, // Optional
  raw_data: items[0].json
};

return [{ json: dailySnapshot }];
```

**Supabase Node - Upsert Daily Metrics:**

- **Operation**: Upsert Row
- **Table**: `campaign_metrics_daily`
- **Conflict Resolution**: `campaign_id,snapshot_date`
- **Map fields from previous node**

### 4. Test n8n Integration

1. Run your n8n workflow manually
2. Check Supabase for new records:
   ```sql
   SELECT * FROM campaign_metrics_daily
   ORDER BY recorded_at DESC
   LIMIT 5;
   ```
3. Run workflow again (same day) - should update existing records, not create duplicates
4. Verify unique constraint:
   ```sql
   SELECT campaign_id, snapshot_date, COUNT(*)
   FROM campaign_metrics_daily
   GROUP BY campaign_id, snapshot_date
   HAVING COUNT(*) > 1;
   ```
   Should return 0 rows (no duplicates)

## TypeScript Usage

### Fetching Time-Series Data

```typescript
import { createClient } from '@supabase/supabase-js'
import type { CampaignMetricsDaily } from '@/lib/types/campaigns'

const supabase = createClient(...)

// Get last 30 days for a campaign
const { data, error } = await supabase
  .from('campaign_metrics_daily')
  .select('*')
  .eq('campaign_id', campaignId)
  .gte('snapshot_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  .order('snapshot_date', { ascending: false })

const metrics: CampaignMetricsDaily[] = data || []
```

### Calculating Rates from Raw Counts

```typescript
// Calculate reply rate from aggregated totals (correct way)
const totalEmailsSent = metrics.reduce((sum, m) => sum + m.emails_sent, 0)
const totalReplies = metrics.reduce((sum, m) => sum + m.replies, 0)
const replyRate = (totalReplies / totalEmailsSent) * 100

// Calculate positive rate
const totalPositiveReplies = metrics.reduce((sum, m) => sum + m.positive_replies, 0)
const positiveRate = (totalPositiveReplies / totalReplies) * 100

// DON'T calculate rates per day and then average them
// ❌ Wrong: const avgRate = metrics.map(m => m.replies / m.emails_sent).reduce((a, b) => a + b) / metrics.length
// ✅ Correct: Calculate from aggregated totals (as shown above)
```

### Building Trend Data

```typescript
import type { MetricsTimeSeriesPoint, CampaignMetricsTrend } from '@/lib/types/campaigns'

// Build time series data for charting
const timeSeriesData: MetricsTimeSeriesPoint[] = metrics.map(m => ({
  date: m.snapshot_date,
  value: m.replies,
  label: new Date(m.snapshot_date).toLocaleDateString()
}))

// Calculate trend
const currentValue = metrics[0]?.replies || 0
const previousValue = metrics[metrics.length - 1]?.replies || 0
const change = currentValue - previousValue
const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0
const trend: 'up' | 'down' | 'neutral' =
  change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'

const trendData: CampaignMetricsTrend = {
  campaign_id: campaignId,
  campaign_name: campaignName,
  current_value: currentValue,
  previous_value: previousValue,
  change,
  change_percent: changePercent,
  trend,
  data_points: timeSeriesData
}
```

## Common Query Patterns

### Last 30 Days

```sql
SELECT
  snapshot_date,
  emails_sent,
  replies,
  opens,
  clicks
FROM campaign_metrics_daily
WHERE campaign_id = $1
  AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY snapshot_date DESC;
```

### Daily Growth

```sql
WITH daily_metrics AS (
  SELECT
    snapshot_date,
    emails_sent,
    LAG(emails_sent) OVER (ORDER BY snapshot_date) as prev_emails_sent
  FROM campaign_metrics_daily
  WHERE campaign_id = $1
  ORDER BY snapshot_date
)
SELECT
  snapshot_date,
  emails_sent - COALESCE(prev_emails_sent, 0) as new_emails_sent
FROM daily_metrics;
```

### Weekly Aggregation

```sql
SELECT
  DATE_TRUNC('week', snapshot_date) as week_start,
  SUM(emails_sent) as total_emails_sent,
  SUM(replies) as total_replies,
  SUM(opens) as total_opens
FROM campaign_metrics_daily
WHERE campaign_id = $1
GROUP BY DATE_TRUNC('week', snapshot_date)
ORDER BY week_start DESC;
```

### Compare Multiple Campaigns

```sql
SELECT
  c.name,
  SUM(cmd.emails_sent) as total_emails,
  SUM(cmd.replies) as total_replies,
  ROUND((SUM(cmd.replies)::decimal / NULLIF(SUM(cmd.emails_sent), 0)) * 100, 2) as reply_rate
FROM campaign_metrics_daily cmd
JOIN campaigns c ON c.id = cmd.campaign_id
WHERE cmd.snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.name
ORDER BY reply_rate DESC;
```

## Data Retention

By default, metrics are kept indefinitely. To implement retention:

### Option 1: Manual Cleanup

Run periodically via Supabase SQL Editor or n8n scheduled workflow:

```sql
SELECT cleanup_old_campaign_metrics(365); -- Keep last 365 days
```

### Option 2: Automated Cleanup (pg_cron)

Enable pg_cron extension in Supabase and schedule:

```sql
-- Run daily at 2 AM
SELECT cron.schedule(
  'cleanup-old-metrics',
  '0 2 * * *',
  'SELECT cleanup_old_campaign_metrics(365);'
);
```

## Data Volume Estimates

- **100 campaigns × 365 days** = 36,500 rows/year (~36 MB)
- **500 campaigns × 365 days** = 182,500 rows/year (~180 MB)
- **1000 campaigns × 365 days** = 365,000 rows/year (~360 MB)

With proper indexing, queries on single campaign will be <10ms.

## Troubleshooting

### Duplicate Records

If you see duplicate records for same campaign + date:

```sql
-- Find duplicates
SELECT campaign_id, snapshot_date, COUNT(*)
FROM campaign_metrics_daily
GROUP BY campaign_id, snapshot_date
HAVING COUNT(*) > 1;

-- Remove duplicates (keeps most recent)
DELETE FROM campaign_metrics_daily a
USING campaign_metrics_daily b
WHERE a.campaign_id = b.campaign_id
  AND a.snapshot_date = b.snapshot_date
  AND a.recorded_at < b.recorded_at;
```

### Missing Data

Check if n8n workflow is running and data is being inserted:

```sql
-- Check recent activity
SELECT
  COUNT(*) as records_today,
  MAX(recorded_at) as last_update
FROM campaign_metrics_daily
WHERE snapshot_date = CURRENT_DATE;
```

### RLS Issues

If you get permission errors, verify service role key is used in n8n (not anon key):

```javascript
// In n8n Supabase credential configuration
// Use Service Role Key (bypasses RLS)
// NOT Anon Key (subject to RLS)
```

## Next Steps (Future Enhancements)

1. **API Endpoints** - Create Next.js API routes to fetch time-series data
   - `GET /api/campaigns/[id]/metrics?days=30`
   - `GET /api/campaigns/[id]/trends`

2. **UI Components** - Build chart components for visualization
   - Line charts for metrics over time
   - Trend indicators with change percentages
   - Comparison views for multiple campaigns

3. **Alerts** - Set up anomaly detection
   - Notify when metrics drop significantly
   - Alert on sudden spikes or drops

4. **Step-Level Metrics** - Extend to track step performance over time
   - Create `step_metrics_daily` table
   - Track variant performance trends

## Support

For issues or questions:
- Check N8N_SYNC_GUIDE.md for integration details
- Review verify-time-series-schema.sql for testing queries
- Check Supabase logs for errors
- Verify RLS policies are correctly configured
