# Alaiso Reporting Centre - 1-Week MVP Implementation Plan

## Executive Summary

Building a **Campaign Variant Comparison Tool** as the centerpiece of Alaiso's reporting centre, with supporting campaign dashboard and cross-campaign analytics. This MVP will be delivered in **1 week** with real Instantly API integration, focusing on the core need: comparing email variants side-by-side with performance metrics.

---

## Confirmed Scope & Decisions

### MVP Features (1 Week Deadline)
1. ✅ **Variant Comparison Tool (PRIMARY)** - Side-by-side subject lines + email body + metrics
2. ✅ **Campaign Health Dashboard** - Overview of all campaigns with key metrics
3. ✅ **Cross-Campaign Analytics** - Aggregate performance comparison
4. ✅ **Real Instantly Integration** - Live data sync, no mocks
5. ✅ **Variant Grouping System** - User creates variant relationships (Instantly doesn't track natively)

### Key Decisions Made
- **Data Source:** Instantly API first (credentials ready)
- **Access Model:** Agency internal only (no client portal in MVP)
- **Comparison Elements:** Subject lines + email body copy + performance metrics
- **Metadata Storage:** Supabase database (full control, flexible queries)
- **Timeline:** 1 week MVP with minimal UI polish (functionality over beauty)
- **Scope:** Real Instantly data required, basic metrics only acceptable

### Out of Scope for MVP
- ❌ Client report generation (Phase 2)
- ❌ Slack notifications (Phase 2)
- ❌ Airtable import (Phase 2)
- ❌ Lead/TAM database integration (Phase 2)
- ❌ Client-facing portal (Phase 2)

---

## Technical Research Summary

### Instantly API V2 Structure

**Sources:**
- [Instantly API V2](https://developer.instantly.ai/)
- [Campaign Endpoints](https://developer.instantly.ai/api/v2/campaign)
- [Get Campaign](https://developer.instantly.ai/api/v2/campaign/getcampaign)
- [Analytics Endpoints](https://developer.instantly.ai/api/v2/analytics/getcampaignanalytics)

**Available Campaign Data:**
- `id`, `name`, `status`, `sequences` (array with steps)
- `auto_variant_select`, `daily_limit`, `stop_on_reply`
- `link_tracking`, `open_tracking`, timestamps
- Sequences contain: `subject`, `body` (text/html), step order

**Available Analytics Metrics:**
- Core counts: leads, contacted, emails_sent, open, reply, bounced, unsubscribed
- Unique metrics: open_count_unique, reply_count_unique, link_click_count_unique
- Per-step breakdowns: open_count_unique_by_step, reply_count_unique_by_step
- Opportunities: total_opportunities, total_opportunity_value

**Authentication:** Bearer token with scopes (campaigns:read, analytics:read)

### Variant Organization Strategy

**Finding:** Instantly doesn't provide built-in variant tracking or A/B test relationships.

**Solution:** Build custom variant grouping system:
1. Admin manually creates "Variant Group" (e.g., "Welcome Email Test - Jan 2026")
2. Selects 2+ campaigns to compare
3. System assigns labels (Variant A, B, C...)
4. Relationships stored in our database
5. Comparison view queries by variant_group_id

---

## Database Schema Design

**File:** `/Users/devrimcelikay/alaisoHub/supabase-schema-campaigns.sql`

### Core Tables

1. **`instantly_credentials`** - Store Instantly API keys (admin only)
2. **`campaigns`** - Synced campaigns from Instantly with full raw data
3. **`campaign_sequences`** - Email sequences (subject + body per step)
4. **`campaign_analytics`** - Metrics snapshots (opens, replies, bounces, rates)
5. **`variant_groups`** - User-created variant comparison groups
6. **`campaign_variants`** - Many-to-many link between groups and campaigns
7. **`sync_history`** - Track sync operations and errors

### Key Design Decisions

- **JSONB storage** for raw Instantly data (flexibility for future fields)
- **Calculated metrics** (open_rate, reply_rate, bounce_rate) for fast queries
- **RLS policies** enforce admin-only writes, authenticated reads
- **Cascading deletes** when variant groups removed
- **Indexes** on foreign keys, timestamps, and search fields
- **Triggers** for updated_at timestamps

---

## API Routes Architecture

**Base Path:** `/Users/devrimcelikay/alaisoHub/app/api/`

### Critical API Routes

1. **`/instantly/credentials/route.ts`** - GET/POST Instantly API key (admin only)
2. **`/campaigns/sync/route.ts`** - POST to sync campaigns + sequences from Instantly
3. **`/campaigns/sync-analytics/route.ts`** - POST to sync analytics for all campaigns
4. **`/campaigns/route.ts`** - GET list all campaigns with latest analytics
5. **`/variant-groups/route.ts`** - GET/POST list and create variant groups
6. **`/variant-groups/[id]/route.ts`** - GET/DELETE variant group details with comparisons

### Data Flow

```
Sync: Admin → POST /campaigns/sync → Instantly API → Supabase (campaigns + sequences)
      Admin → POST /campaigns/sync-analytics → Instantly API → Supabase (analytics)

View: User → GET /campaigns → Supabase (campaigns with analytics)
      User → GET /variant-groups/[id] → Supabase (full comparison data)
```

---

## Component Architecture

**Base Path:** `/Users/devrimcelikay/alaisoHub/components/campaigns/`

### Core Components

1. **`ReportingDashboard.tsx`** - Main page with tabs (Dashboard, Variants, Settings)
2. **`CampaignDashboard.tsx`** - Grid view of all campaigns with metrics
3. **`VariantComparison.tsx`** - Variant group selector + comparison view
4. **`VariantComparisonGrid.tsx`** ⭐ **PRIMARY FEATURE** - Side-by-side comparison
5. **`EmailPreview.tsx`** - Subject + body display with text/HTML toggle
6. **`MetricsCard.tsx`** - Single metric display with visual indicators
7. **`CampaignCard.tsx`** - Individual campaign in grid
8. **`CreateVariantGroupModal.tsx`** - Form to create variant groups
9. **`CampaignSettings.tsx`** - API key setup and sync controls
10. **`SyncStatus.tsx`** - Sync history and status indicator

### Layout Structure

```
ReportingDashboard
├── Tab: Dashboard
│   ├── SyncStatus (top bar)
│   ├── MetricsOverview (aggregate stats)
│   └── CampaignDashboard
│       └── CampaignCard[] (grid)
├── Tab: Variant Comparison ⭐
│   ├── VariantGroupSelector (dropdown)
│   └── VariantComparisonGrid
│       ├── EmailPreview[] (side-by-side)
│       └── MetricsCard[] (comparison table)
└── Tab: Settings
    ├── CampaignSettings (API key)
    └── SyncStatus (history log)
```

---

## 7-Day Implementation Timeline

### **Day 1 (Mon): Database + API Foundation**
- [ ] Run SQL migration (`supabase-schema-campaigns.sql`)
- [ ] Create TypeScript types (`lib/types/campaigns.ts`)
- [ ] Build Instantly API client (`lib/instantly/client.ts`)
- [ ] Create credentials API route
- [ ] Create campaigns sync API route
- [ ] Test real Instantly sync

**Deliverable:** Campaigns syncing from Instantly to database

---

### **Day 2 (Tue): Complete API Layer**
- [ ] Create analytics sync API route
- [ ] Create campaigns GET route
- [ ] Create variant groups routes (GET/POST)
- [ ] Create variant group detail route (GET/DELETE)
- [ ] Test all endpoints with Thunder Client

**Deliverable:** All API routes functional

---

### **Day 3 (Wed): Core UI Components**
- [ ] Build `CampaignSettings.tsx`
- [ ] Build `SyncStatus.tsx`
- [ ] Build `MetricsCard.tsx`
- [ ] Build `CampaignCard.tsx`
- [ ] Build `EmailPreview.tsx`

**Deliverable:** Reusable components ready

---

### **Day 4 (Thu): Dashboard + Variant Setup**
- [ ] Build `ReportingDashboard.tsx` (main container)
- [ ] Build `CampaignDashboard.tsx` (grid view)
- [ ] Build `CreateVariantGroupModal.tsx`
- [ ] Integrate with main `app/page.tsx`
- [ ] Test dashboard functionality

**Deliverable:** Working campaign dashboard

---

### **Day 5 (Fri): Variant Comparison** ⭐ **PRIORITY DAY**
- [ ] Build `VariantComparison.tsx`
- [ ] Build `VariantComparisonGrid.tsx` (side-by-side layout)
- [ ] Implement subject line comparison
- [ ] Implement body copy comparison (text/HTML toggle)
- [ ] Add metrics comparison table

**Deliverable:** Working variant comparison tool

---

### **Day 6 (Sat): Polish + Cross-Campaign Analytics**
- [ ] Build `MetricsOverview.tsx` (aggregate view)
- [ ] Add filtering/sorting to dashboard
- [ ] Add winner highlighting in comparisons
- [ ] Improve responsive design
- [ ] Add loading states and error handling

**Deliverable:** Polished UI with analytics

---

### **Day 7 (Sun): Testing + Refinement**
- [ ] End-to-end user flow testing
- [ ] Bug fixes from testing
- [ ] Performance optimization
- [ ] Edge case handling
- [ ] Final UI polish

**Deliverable:** Production-ready MVP

---

## Technical Implementation Notes

### Variant Grouping Logic

Since Instantly doesn't track variants natively:
1. Admin creates "Variant Group" with descriptive name
2. Selects 2+ campaigns to compare
3. System assigns labels (A, B, C...) automatically
4. Junction table stores relationships
5. Comparison queries by `variant_group_id`

### Sync Strategy

- **Manual sync** triggered by admin (button in UI)
- **Sequential sync** (campaigns first, then analytics)
- **Error handling** continues on failure, logs errors
- **Sync history** tracks every operation for debugging

### Performance

- **Pagination** for campaign lists (if 100+ campaigns)
- **Lazy loading** for variant comparison details
- **Indexed queries** on campaign_id, variant_group_id
- **Optimistic UI** updates during sync operations

### Security

- **RLS policies** on all tables (admin writes, authenticated reads)
- **API key storage** in database (consider encryption)
- **Auth checks** in every API route
- **Admin role** required for sync and variant creation

---

## Critical Files to Create/Modify

### New Files (23 files)

**Database:**
- `supabase-schema-campaigns.sql`

**Types:**
- `lib/types/campaigns.ts`

**Integration:**
- `lib/instantly/client.ts`

**API Routes:**
- `app/api/instantly/credentials/route.ts`
- `app/api/campaigns/sync/route.ts`
- `app/api/campaigns/sync-analytics/route.ts`
- `app/api/campaigns/route.ts`
- `app/api/variant-groups/route.ts`
- `app/api/variant-groups/[id]/route.ts`

**Components:**
- `components/campaigns/ReportingDashboard.tsx`
- `components/campaigns/CampaignDashboard.tsx`
- `components/campaigns/CampaignCard.tsx`
- `components/campaigns/VariantComparison.tsx`
- `components/campaigns/VariantComparisonGrid.tsx` ⭐ **PRIORITY**
- `components/campaigns/EmailPreview.tsx`
- `components/campaigns/MetricsCard.tsx`
- `components/campaigns/MetricsOverview.tsx`
- `components/campaigns/CreateVariantGroupModal.tsx`
- `components/campaigns/CampaignSettings.tsx`
- `components/campaigns/SyncStatus.tsx`

### Modified Files (1 file)

- `app/page.tsx` - Update `renderContent()` to show ReportingDashboard when `activeApp === 'reporting'`

---

## Verification & Testing

### End-to-End Test Flow

1. **Setup:** Admin enters Instantly API key in Settings tab
2. **Sync Campaigns:** Click "Sync Campaigns" button, verify campaigns appear in Dashboard
3. **Sync Analytics:** Click "Sync Analytics" button, verify metrics populate
4. **View Dashboard:** Confirm all campaigns show with open rates, reply rates, bounce rates
5. **Create Variant Group:** Select 2-3 campaigns, create group named "Test Group A"
6. **View Comparison:** Navigate to Variant Comparison tab, select "Test Group A"
7. **Verify Comparison:** Confirm side-by-side subject lines, body copy, and metrics display
8. **Test Filters:** Sort campaigns by reply rate, filter by status
9. **Cross-Campaign Analytics:** Verify aggregate metrics across all campaigns

### Success Criteria

- ✅ Instantly API connection works
- ✅ Campaigns sync with sequences (subject + body)
- ✅ Analytics sync with calculated rates
- ✅ Variant groups can be created
- ✅ Side-by-side comparison displays correctly
- ✅ Metrics are accurate and up-to-date
- ✅ UI is responsive and intuitive
- ✅ No errors in console
- ✅ Page loads in < 2 seconds

---

## Post-MVP Enhancements (Phase 2)

1. **Client Report Generation** - PDF/email weekly reports
2. **Slack Notifications** - Alert on key metric thresholds
3. **Airtable Import** - One-time historical data migration
4. **Advanced Filters** - Date ranges, personas, angles
5. **Export Functionality** - CSV/Excel downloads
6. **Charting Library** - Visual graphs (Recharts)
7. **Client Portal** - Read-only views for clients (multi-tenant)
8. **Scheduled Sync** - Automatic daily sync jobs

---

*This plan is ready for execution. All technical decisions have been made, API structure confirmed, and implementation timeline is realistic for 1-week delivery.*
