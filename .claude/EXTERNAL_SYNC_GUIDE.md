# External Data Sync Guide (n8n/Make)

This guide shows how to structure your n8n or Make workflow to sync Instantly campaign data to the database.

---

## Overview

The UI is **view-only**. All data syncing happens externally via your automation workflow.

**Sync Order:**
1. Campaigns (with sequences)
2. Analytics

---

## Database Tables

### 1. campaigns
Store campaign metadata from Instantly.

**Required Fields:**
- `instantly_campaign_id` (string, unique) - Instantly's campaign ID
- `name` (string) - Campaign name
- `status` (string, nullable) - active/paused/draft/completed
- `last_synced_at` (timestamp) - When this campaign was last synced

**Optional Fields:**
- `auto_variant_select` (boolean)
- `daily_limit` (integer)
- `stop_on_reply` (boolean)
- `link_tracking` (boolean)
- `open_tracking` (boolean)
- `raw_data` (jsonb) - Store full API response

**Upsert Key:** `instantly_campaign_id`

---

### 2. campaign_sequences
Store email sequences (subject + body) for each campaign.

**Required Fields:**
- `campaign_id` (uuid) - Foreign key to campaigns.id
- `step_number` (integer) - 1, 2, 3, etc.
- `subject` (string) - Email subject line
- `body_text` (text, nullable) - Plain text version
- `body_html` (text, nullable) - HTML version

**Process:**
1. Get campaign.id from campaigns table
2. Delete existing sequences for this campaign
3. Insert new sequences from API response

---

### 3. campaign_analytics
Store performance metrics for each campaign.

**Required Fields:**
- `campaign_id` (uuid, unique) - Foreign key to campaigns.id
- `leads_count` (integer)
- `contacted_count` (integer)
- `emails_sent_count` (integer)
- `open_count` (integer)
- `open_count_unique` (integer)
- `reply_count` (integer)
- `reply_count_unique` (integer)
- `bounced_count` (integer)
- `unsubscribed_count` (integer)
- `link_click_count_unique` (integer)
- `completed_count` (integer)
- `total_opportunities` (integer)
- `total_opportunity_value` (numeric)

**Calculated Fields (calculate in workflow):**
- `open_rate` = (open_count_unique / contacted_count) * 100
- `reply_rate` = (reply_count_unique / contacted_count) * 100
- `bounce_rate` = (bounced_count / emails_sent_count) * 100

**Optional:**
- `raw_data` (jsonb) - Store full analytics response
- `synced_at` (timestamp) - When analytics were synced

**Upsert Key:** `campaign_id`

---

## Workflow Steps

### Step 1: Get All Campaigns

**API Call:**
```
GET https://api.instantly.ai/api/v2/campaigns
Headers:
  Authorization: Bearer YOUR_API_KEY
```

**Response Example:**
```json
[
  {
    "id": "camp_123abc",
    "name": "Welcome Email Series",
    "status": "active",
    "auto_variant_select": false,
    "daily_limit": 50,
    "stop_on_reply": true,
    "link_tracking": true,
    "open_tracking": true
  }
]
```

---

### Step 2: For Each Campaign - Upsert Campaign

**SQL (Supabase/PostgreSQL):**
```sql
INSERT INTO campaigns (
  instantly_campaign_id,
  name,
  status,
  auto_variant_select,
  daily_limit,
  stop_on_reply,
  link_tracking,
  open_tracking,
  raw_data,
  last_synced_at
) VALUES (
  'camp_123abc',
  'Welcome Email Series',
  'active',
  false,
  50,
  true,
  true,
  true,
  '{"full": "api response"}',
  NOW()
)
ON CONFLICT (instantly_campaign_id)
DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  auto_variant_select = EXCLUDED.auto_variant_select,
  daily_limit = EXCLUDED.daily_limit,
  stop_on_reply = EXCLUDED.stop_on_reply,
  link_tracking = EXCLUDED.link_tracking,
  open_tracking = EXCLUDED.open_tracking,
  raw_data = EXCLUDED.raw_data,
  last_synced_at = NOW(),
  updated_at = NOW()
RETURNING id;
```

**Save the returned `id` for the next steps.**

---

### Step 3: Get Campaign Details (Sequences)

**API Call:**
```
GET https://api.instantly.ai/api/v2/campaigns/{campaign_id}
Headers:
  Authorization: Bearer YOUR_API_KEY
```

**Response Example:**
```json
{
  "id": "camp_123abc",
  "name": "Welcome Email Series",
  "sequences": [
    {
      "steps": [
        {
          "subject": "Welcome!",
          "body": {
            "text": "Plain text version...",
            "html": "<html>HTML version...</html>"
          }
        },
        {
          "subject": "Follow up",
          "body": {
            "text": "Follow up text...",
            "html": "<html>Follow up HTML...</html>"
          }
        }
      ]
    }
  ]
}
```

---

### Step 4: Delete Old Sequences

**SQL:**
```sql
DELETE FROM campaign_sequences
WHERE campaign_id = 'uuid-from-step-2';
```

---

### Step 5: Insert New Sequences

**For each step in sequences[0].steps:**

**SQL:**
```sql
INSERT INTO campaign_sequences (
  campaign_id,
  step_number,
  subject,
  body_text,
  body_html
) VALUES (
  'uuid-from-step-2',
  1,
  'Welcome!',
  'Plain text version...',
  '<html>HTML version...</html>'
);
```

---

### Step 6: Get Analytics

**API Call:**
```
GET https://api.instantly.ai/api/v2/analytics/campaign?campaign_id={campaign_id}
Headers:
  Authorization: Bearer YOUR_API_KEY
```

**Response Example:**
```json
{
  "campaign_id": "camp_123abc",
  "leads_count": 1000,
  "contacted_count": 850,
  "emails_sent_count": 2500,
  "open_count": 600,
  "open_count_unique": 450,
  "reply_count": 120,
  "reply_count_unique": 95,
  "bounced_count": 25,
  "unsubscribed_count": 5,
  "link_click_count_unique": 200,
  "completed_count": 100,
  "total_opportunities": 15,
  "total_opportunity_value": 50000
}
```

---

### Step 7: Calculate Rates

**In your workflow, calculate:**
```javascript
const openRate = contacted_count > 0
  ? (open_count_unique / contacted_count) * 100
  : 0;

const replyRate = contacted_count > 0
  ? (reply_count_unique / contacted_count) * 100
  : 0;

const bounceRate = emails_sent_count > 0
  ? (bounced_count / emails_sent_count) * 100
  : 0;
```

---

### Step 8: Upsert Analytics

**SQL:**
```sql
INSERT INTO campaign_analytics (
  campaign_id,
  leads_count,
  contacted_count,
  emails_sent_count,
  open_count,
  open_count_unique,
  reply_count,
  reply_count_unique,
  bounced_count,
  unsubscribed_count,
  link_click_count_unique,
  completed_count,
  total_opportunities,
  total_opportunity_value,
  open_rate,
  reply_rate,
  bounce_rate,
  raw_data,
  synced_at
) VALUES (
  'uuid-from-step-2',
  1000, 850, 2500, 600, 450, 120, 95, 25, 5, 200, 100, 15, 50000,
  52.94, 11.18, 1.0,
  '{"full": "analytics response"}',
  NOW()
)
ON CONFLICT (campaign_id)
DO UPDATE SET
  leads_count = EXCLUDED.leads_count,
  contacted_count = EXCLUDED.contacted_count,
  emails_sent_count = EXCLUDED.emails_sent_count,
  open_count = EXCLUDED.open_count,
  open_count_unique = EXCLUDED.open_count_unique,
  reply_count = EXCLUDED.reply_count,
  reply_count_unique = EXCLUDED.reply_count_unique,
  bounced_count = EXCLUDED.bounced_count,
  unsubscribed_count = EXCLUDED.unsubscribed_count,
  link_click_count_unique = EXCLUDED.link_click_count_unique,
  completed_count = EXCLUDED.completed_count,
  total_opportunities = EXCLUDED.total_opportunities,
  total_opportunity_value = EXCLUDED.total_opportunity_value,
  open_rate = EXCLUDED.open_rate,
  reply_rate = EXCLUDED.reply_rate,
  bounce_rate = EXCLUDED.bounce_rate,
  raw_data = EXCLUDED.raw_data,
  synced_at = NOW();
```

---

## Complete Workflow Summary

```
1. GET /campaigns from Instantly
2. Loop through each campaign:
   a. UPSERT campaign → Save campaign.id
   b. GET /campaigns/{id} for sequences
   c. DELETE old sequences for campaign.id
   d. INSERT new sequences
   e. GET /analytics/campaign?campaign_id={id}
   f. Calculate open_rate, reply_rate, bounce_rate
   g. UPSERT analytics
3. Done! Data is now in database and visible in UI
```

---

## Recommended Sync Schedule

- **Campaigns**: Once per day (campaigns rarely change)
- **Analytics**: Every 1-4 hours (metrics update frequently)

---

## n8n Example Nodes

1. **HTTP Request** - Get campaigns from Instantly
2. **Loop Over Items** - For each campaign
3. **Supabase** - Upsert campaign
4. **HTTP Request** - Get campaign details
5. **Supabase** - Delete sequences
6. **Loop Over Items** - For each sequence step
7. **Supabase** - Insert sequence
8. **HTTP Request** - Get analytics
9. **Function** - Calculate rates
10. **Supabase** - Upsert analytics

---

## Testing

After running your workflow:

1. Open the Alaiso Hub app
2. Navigate to **Reporting**
3. You should see all campaigns in the Dashboard
4. Click a campaign to see metrics
5. Use filters and search to explore data

---

## Notes

- The UI automatically refreshes when you reload the page
- No sync buttons in the UI - all syncing is external
- Create variant groups in the UI to compare campaigns
- Variant comparison view coming in Day 5

---

**Questions?** Check the database schema in `supabase-schema-campaigns.sql`
