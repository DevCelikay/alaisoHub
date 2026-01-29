# N8N Sync Guide for Campaigns

This guide explains how to sync campaign data from Instantly.ai to Supabase using n8n workflows.

## Overview

All campaign and analytics syncing is handled externally via n8n workflows. The UI is read-only and displays data from Supabase.

## Database Schema

### Tables

1. **campaigns** - Campaign metadata and aggregated analytics
2. **steps** - Individual email steps with variants (1A, 1B, 2A, 2B, etc.)
3. **instantly_credentials** - API credentials (can be managed via n8n or UI)

### Key Fields

#### campaigns
- `instantly_campaign_id` (TEXT, UNIQUE) - Instantly's campaign ID
- `name` (TEXT) - Campaign name
- `credential_id` (UUID) - Link to instantly_credentials
- `status` (INTEGER) - 1 = active, 3 = paused
- Analytics: `emails_sent`, `replies`, `opens`, `clicks`, `positive_replies`, `leads_total`, `leads_not_started`
- Rates: `reply_rate`, `positive_rate`

#### steps
- `campaign_id` (UUID) - Foreign key to campaigns
- `step_number` (INTEGER) - 1, 2, 3, etc.
- `variant` (TEXT) - 'A', 'B', 'C', etc.
- Unique constraint: `(campaign_id, step_number, variant)`
- Content: `subject`, `body_html`
- Analytics: `sent`, `opened`, `unique_opened`, `replies`, `unique_replies`, `clicks`, `unique_clicks`, etc.

## Sync Process

### 1. Sync Campaigns

**Using Supabase API:**

**Supabase Node:**
- **Operation**: Upsert Row
- **Table**: `campaigns`
- **Conflict Resolution**: `instantly_campaign_id`
- **Data**:
```json
{
  "instantly_campaign_id": "{{ $json.id }}",
  "name": "{{ $json.name }}",
  "credential_id": "{{ $json.credential_id }}",
  "status": {{ $json.status }},
  "raw_data": {{ $json }},
  "last_synced_at": "{{ $now.toISO() }}"
}
```

**HTTP Request:**
```
POST https://YOUR_PROJECT.supabase.co/rest/v1/campaigns?onConflict=instantly_campaign_id
Headers:
  Prefer: resolution=merge-duplicates
Body: { campaign data }
```

**Note:** Analytics fields (`emails_sent`, `replies`, etc.) are updated separately via analytics sync, not during campaign sync.

### 2. Sync Steps

**Unique Identification:** Steps are uniquely identified by the combination of:
- `campaign_id` (UUID)
- `step_number` (INTEGER) - 1, 2, 3, etc.
- `variant` (TEXT) - 'A', 'B', 'C', etc.

**Example:** For campaign "ABC123", step 1 variant A is: `(campaign_id='...', step_number=1, variant='A')`

#### Option A: Supabase API (Recommended for n8n)

Use the **Supabase** node in n8n or **HTTP Request** node:

**Minimal Body (Campaign ID, Step Number, Variant, Copy Only):**

```json
{
  "campaign_id": "{{ $json.campaign_id }}",
  "step_number": {{ $json.step_number }},
  "variant": "{{ $json.variant }}",
  "subject": "{{ $json.subject }}",
  "body_html": "{{ $json.body_html }}"
}
```

**Using Supabase n8n Node:**
1. Add **Supabase** node
2. **Operation**: Upsert Row
3. **Table**: `steps`
4. **Data to Upsert**: Use minimal body above
5. **Conflict Resolution**: Select columns `campaign_id,step_number,variant`

**Using HTTP Request Node (REST API):**
```
POST https://YOUR_PROJECT.supabase.co/rest/v1/steps?onConflict=campaign_id,step_number,variant
Headers:
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ANON_KEY
  Content-Type: application/json
  Prefer: resolution=merge-duplicates
Body:
{
  "campaign_id": "{{ $json.campaign_id }}",
  "step_number": {{ $json.step_number }},
  "variant": "{{ $json.variant }}",
  "subject": "{{ $json.subject }}",
  "body_html": "{{ $json.body_html }}"
}
```

**Full Body (With All Fields):**
```json
{
  "campaign_id": "{{ $json.campaign_id }}",
  "step_number": {{ $json.step_number }},
  "variant": "{{ $json.variant }}",
  "subject": "{{ $json.subject }}",
  "body_html": "{{ $json.body_html }}",
  "delay": {{ $json.delay }},
  "raw_data": {{ $json.raw_data }},
  "last_synced_at": "{{ $now.toISO() }}"
}
```

**Important Notes:**
- Supabase API automatically preserves existing analytics when upserting (only updates provided fields)
- The `onConflict` parameter tells Supabase which columns form the unique constraint
- Use `resolution=merge-duplicates` header to merge on conflict (upsert behavior)

#### Option B: PostgreSQL Function (Alternative)

If you need more control, use the `upsert_step` function via SQL:

```sql
SELECT upsert_step(
  p_campaign_id := $1::uuid,
  p_step_number := $2::integer,
  p_variant := $3::text,
  p_subject := $4::text,
  p_body_html := $5::text,
  p_delay := $6::integer,
  p_raw_data := $7::jsonb,
  p_last_synced_at := NOW(),
  p_sent := NULL,
  p_opened := NULL,
  p_unique_opened := NULL,
  p_replies := NULL,
  p_unique_replies := NULL,
  p_clicks := NULL,
  p_unique_clicks := NULL,
  p_opportunities := NULL,
  p_unique_opportunities := NULL
);
```

### 3. Sync Analytics

**Update Campaign Analytics (Supabase API):**

**Supabase Node:**
- **Operation**: Update Row
- **Table**: `campaigns`
- **Filter**: `instantly_campaign_id.eq.{{ $json.instantly_campaign_id }}`
- **Update Data**:
```json
{
  "emails_sent": {{ $json.emails_sent_count }},
  "replies": {{ $json.reply_count_unique }},
  "opens": {{ $json.open_count_unique }},
  "clicks": {{ $json.link_click_count_unique }},
  "positive_replies": {{ $json.total_interested }},
  "leads_total": {{ $json.leads_count }},
  "leads_not_started": {{ $json.leads_count - $json.contacted_count }},
  "reply_rate": {{ ($json.reply_count_unique / Math.max($json.contacted_count, 1)) * 100 }},
  "positive_rate": {{ ($json.total_interested / Math.max($json.reply_count_unique, 1)) * 100 }},
  "last_synced_at": "{{ $now.toISO() }}"
}
```

**Update Step Analytics (Supabase API):**

**Supabase Node:**
- **Operation**: Update Row
- **Table**: `steps`
- **Filter**: 
  - `campaign_id.eq.{{ $json.campaign_id }}`
  - `step_number.eq.{{ $json.step }}`
  - `variant.eq.{{ $json.variant }}`
- **Update Data**:
```json
{
  "sent": {{ $json.sent }},
  "opened": {{ $json.opened }},
  "unique_opened": {{ $json.unique_opened }},
  "replies": {{ $json.replies }},
  "unique_replies": {{ $json.unique_replies }},
  "clicks": {{ $json.clicks }},
  "unique_clicks": {{ $json.unique_clicks }},
  "opportunities": {{ $json.opportunities }},
  "unique_opportunities": {{ $json.unique_opportunities }},
  "last_synced_at": "{{ $now.toISO() }}"
}
```

**Alternative: Use Upsert with Analytics**
You can also upsert steps with analytics included - Supabase will update all provided fields:
```json
{
  "campaign_id": "...",
  "step_number": 1,
  "variant": "A",
  "sent": 100,
  "opened": 50,
  ...
}
```
Use `onConflict=campaign_id,step_number,variant` to update existing steps.

## Instantly API Endpoints

1. **Get Campaigns**: `GET /api/v2/campaigns`
2. **Get Campaign Details**: `GET /api/v2/campaigns/{id}`
3. **Get Campaign Analytics**: `GET /api/v2/campaigns/analytics?ids={id}`
4. **Get Step Analytics**: `GET /api/v2/campaigns/analytics/steps?campaign_id={id}`

## N8N Workflow Structure

1. **Trigger**: Schedule (e.g., every hour) or webhook
2. **Get Instantly Credentials**: Query `instantly_credentials` table
3. **Fetch Campaigns**: Call Instantly API `GET /api/v2/campaigns`
4. **For Each Campaign**:
   - **Upsert campaign** using `instantly_campaign_id` as unique key
   - **Get campaign details** `GET /api/v2/campaigns/{id}` to get sequences
   - **Extract steps** from `sequences[0].steps[]`
   - **For each step**:
     - **For each variant** in `step.variants[]`:
       - **Upsert step** using `(campaign_id, step_number, variant)` as unique key
       - Map variant index to letter: 0='A', 1='B', 2='C', etc.
5. **Sync Analytics**: 
   - Fetch campaign analytics `GET /api/v2/campaigns/analytics?ids={id}`
   - Update campaign analytics
   - Fetch step analytics `GET /api/v2/campaigns/analytics/steps?campaign_id={id}`
   - Update step analytics using `(campaign_id, step_number, variant)` to match

## N8N Step Upsert Example

**Input Data Structure:**
```json
{
  "campaign_id": "uuid-from-campaigns-table",
  "step_number": 1,
  "variant": "A",
  "subject": "Welcome email",
  "body_html": "<div>Hello...</div>",
  "delay": 2,
  "raw_data": { "step": {...}, "variant": {...} }
}
```

**Supabase Node Configuration (Recommended):**
1. **Node Type**: Supabase
2. **Operation**: Upsert Row
3. **Table**: `steps`
4. **Data**: Map JSON fields above
5. **Conflict Resolution**: `campaign_id,step_number,variant`

**HTTP Request Node Alternative:**
- **Method**: POST
- **URL**: `https://YOUR_PROJECT.supabase.co/rest/v1/steps?onConflict=campaign_id,step_number,variant`
- **Headers**: Include `apikey`, `Authorization`, `Prefer: resolution=merge-duplicates`
- **Body**: JSON with step data

**Note:** Supabase API will automatically preserve analytics fields that aren't included in the upsert payload.

### 4. Sync Daily Metrics (Time-Series Analytics)

**NEW: Store daily snapshots of campaign metrics for trend analysis.**

After syncing campaign analytics (step 3 above), add a daily snapshot to the `campaign_metrics_daily` table.

**Workflow Addition:**

1. **Prepare Daily Snapshot** (Code Node)
   ```javascript
   // Get current date in YYYY-MM-DD format
   const today = new Date().toISOString().split('T')[0];

   // Map Instantly API metrics to schema fields
   // Store raw counts only - rates calculated dynamically in UI
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
     sync_id: items[0].json.sync_id, // Optional: link to sync_history
     raw_data: items[0].json // Full API response
   };

   return [{ json: dailySnapshot }];
   ```

2. **Upsert to Supabase** (Supabase Node)
   - **Operation**: Upsert Row
   - **Table**: `campaign_metrics_daily`
   - **Conflict Resolution**: `campaign_id,snapshot_date`
   - **Data**:
   ```json
   {
     "campaign_id": "{{ $json.campaign_id }}",
     "snapshot_date": "{{ $json.snapshot_date }}",
     "emails_sent": {{ $json.emails_sent }},
     "replies": {{ $json.replies }},
     "opens": {{ $json.opens }},
     "clicks": {{ $json.clicks }},
     "positive_replies": {{ $json.positive_replies }},
     "leads_total": {{ $json.leads_total }},
     "leads_not_started": {{ $json.leads_not_started }},
     "sync_id": "{{ $json.sync_id }}",
     "raw_data": {{ $json.raw_data }}
   }
   ```

**Using HTTP Request Node:**
```
POST https://YOUR_PROJECT.supabase.co/rest/v1/campaign_metrics_daily?onConflict=campaign_id,snapshot_date
Headers:
  apikey: YOUR_SERVICE_ROLE_KEY
  Authorization: Bearer YOUR_SERVICE_ROLE_KEY
  Content-Type: application/json
  Prefer: resolution=merge-duplicates
Body: { daily snapshot data }
```

**Using PostgreSQL Function:**
```sql
SELECT upsert_campaign_metrics_daily(
  p_campaign_id := $1::uuid,
  p_snapshot_date := $2::date,
  p_emails_sent := $3,
  p_replies := $4,
  p_opens := $5,
  p_clicks := $6,
  p_positive_replies := $7,
  p_leads_total := $8,
  p_leads_not_started := $9,
  p_sync_id := $10::uuid,
  p_raw_data := $11::jsonb
);
```

**Key Points:**
- One snapshot per campaign per day (`(campaign_id, snapshot_date)` is unique)
- Multiple syncs per day update the same snapshot (last sync wins)
- Store raw counts only, not calculated rates
- Rates calculated dynamically in UI from aggregated totals for accuracy
- Example:
  - Day 1: 100 sent, 10 replies = 10%
  - Day 2: 50 sent, 10 replies = 20%
  - Mean of rates: (10% + 20%) / 2 = 15% ❌
  - Actual rate: (10+10) / (100+50) = 13.33% ✅

**Data Retention:**
- Run cleanup function periodically to remove old metrics:
  ```sql
  SELECT cleanup_old_campaign_metrics(365); -- Keep last 365 days
  ```

## Common Query Patterns for Time-Series Data

### Last 30 Days for Campaign
```sql
SELECT
  snapshot_date,
  emails_sent,
  replies,
  opens,
  clicks,
  positive_replies
FROM campaign_metrics_daily
WHERE campaign_id = $1
  AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY snapshot_date DESC;
```

### Calculate Daily Growth
```sql
WITH daily_metrics AS (
  SELECT
    snapshot_date,
    emails_sent,
    replies,
    LAG(emails_sent) OVER (ORDER BY snapshot_date) as prev_emails_sent,
    LAG(replies) OVER (ORDER BY snapshot_date) as prev_replies
  FROM campaign_metrics_daily
  WHERE campaign_id = $1
  ORDER BY snapshot_date
)
SELECT
  snapshot_date,
  emails_sent - COALESCE(prev_emails_sent, 0) as new_emails_sent,
  replies - COALESCE(prev_replies, 0) as new_replies
FROM daily_metrics;
```

### Aggregate to Weekly
```sql
SELECT
  DATE_TRUNC('week', snapshot_date) as week_start,
  SUM(emails_sent) as total_emails_sent,
  SUM(replies) as total_replies,
  SUM(opens) as total_opens,
  SUM(positive_replies) as total_positive_replies
FROM campaign_metrics_daily
WHERE campaign_id = $1
GROUP BY DATE_TRUNC('week', snapshot_date)
ORDER BY week_start DESC;

-- Calculate weekly rates in UI:
-- weekly_reply_rate = (total_replies / total_emails_sent) * 100
-- weekly_positive_rate = (total_positive_replies / total_replies) * 100
```

## Notes

- The `upsert_step` PostgreSQL function preserves analytics when updating existing steps
- Campaigns are identified by `instantly_campaign_id` (unique)
- Steps are identified by `(campaign_id, step_number, variant)` (unique constraint)
- Always preserve analytics data when updating content
- Use `last_synced_at` to track sync timing
- **NEW**: Time-series metrics stored in `campaign_metrics_daily` for trend analysis
- Daily snapshots enable historical comparisons and performance tracking
- Store raw counts only - calculate rates dynamically in UI for accuracy
