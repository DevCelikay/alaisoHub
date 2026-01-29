// =====================================================
// Alaiso Reporting Centre - TypeScript Types
// Campaign tracking, analytics, and variant comparison
// =====================================================

// =====================================================
// Instantly API Response Types
// =====================================================

export interface InstantlyCampaign {
  id: string
  name: string
  status: string
  auto_variant_select?: boolean
  email_list?: string
  daily_limit?: number
  stop_on_reply?: boolean
  link_tracking?: boolean
  open_tracking?: boolean
  timestamp_created?: number
  timestamp_updated?: number
  sequences?: InstantlySequence[]
  // Store everything else in raw_data
  [key: string]: any
}

export interface InstantlySequence {
  steps?: InstantlyStep[]
  [key: string]: any
}

export interface InstantlyStep {
  type?: string // 'email', etc.
  delay?: number
  variants?: InstantlyVariant[]
  [key: string]: any
}

export interface InstantlyVariant {
  subject?: string
  body?: string // HTML body
  [key: string]: any
}

export interface InstantlyAnalytics {
  campaign_id?: string
  campaign_name?: string
  campaign_status?: string
  leads_count: number
  contacted_count: number
  emails_sent_count: number
  new_leads_contacted_count?: number
  open_count: number
  open_count_unique: number
  open_count_unique_by_step?: number[]
  reply_count: number
  reply_count_unique: number
  reply_count_unique_by_step?: number[]
  reply_count_automatic?: number
  bounced_count: number
  unsubscribed_count: number
  link_click_count_unique: number
  completed_count: number
  total_opportunities: number
  total_opportunity_value: number
  [key: string]: any
}

// =====================================================
// Database Types (matching Supabase schema)
// =====================================================

export interface Campaign {
  id: string
  instantly_campaign_id: string
  name: string
  credential_id: string | null
  status: number | null // 1 = active, 3 = paused, etc.

  // Basic Analytics
  emails_sent: number
  replies: number
  opens: number
  clicks: number
  positive_replies: number
  leads_total: number
  leads_not_started: number

  // Optional calculated rates
  reply_rate: number | null
  positive_rate: number | null

  // Relations
  credential?: {
    id: string
    key_name?: string
  } | null

  // Metadata
  raw_data: any
  last_synced_at: string
  created_at: string
  updated_at: string
}

export interface Step {
  id: string
  campaign_id: string
  step_number: number // 1, 2, 3, etc.
  variant: string // 'A', 'B', 'C', etc.
  
  // Email content
  subject: string | null
  body_html: string | null
  
  // Step-level analytics
  sent: number
  opened: number
  unique_opened: number
  replies: number
  unique_replies: number
  clicks: number
  unique_clicks: number
  opportunities: number
  unique_opportunities: number
  
  // Metadata
  delay: number | null
  raw_data: any
  last_synced_at: string
  created_at: string
  updated_at: string
}

export interface InstantlyCredentials {
  id: string
  api_key: string
  key_name: string | null
  created_by: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface SyncHistory {
  id: string
  sync_type: string
  status: string
  campaigns_synced: number
  campaigns_failed: number
  error_message: string | null
  started_at: string
  completed_at: string | null
  created_by: string | null
}

// =====================================================
// Extended Types with Relations
// =====================================================

export interface CampaignWithRelations extends Campaign {
  steps: Step[]
}

export interface MetricDisplay {
  label: string
  value: number | string
  format: 'number' | 'percentage' | 'currency'
  trend?: 'up' | 'down' | 'neutral'
  color?: 'green' | 'red' | 'yellow' | 'gray'
}

export interface SyncStatus {
  syncing: boolean
  lastSync: string | null
  error: string | null
  progress?: {
    current: number
    total: number
  }
}

// =====================================================
// Time-Series Analytics Types
// =====================================================

export interface CampaignMetricsDaily {
  id: string
  campaign_id: string
  snapshot_date: string // ISO date string (YYYY-MM-DD)

  // Core metrics (raw counts - rates calculated dynamically)
  emails_sent: number
  replies: number
  opens: number
  clicks: number
  positive_replies: number
  leads_total: number
  leads_not_started: number

  // Metadata
  sync_id: string | null
  raw_data: any
  recorded_at: string // ISO timestamp
  created_at: string // ISO timestamp
}

export interface MetricsTimeSeriesPoint {
  date: string
  value: number
  label?: string
}

export interface CampaignMetricsTrend {
  campaign_id: string
  campaign_name: string
  current_value: number
  previous_value: number
  change: number
  change_percent: number
  trend: 'up' | 'down' | 'neutral'
  data_points: MetricsTimeSeriesPoint[]
}
