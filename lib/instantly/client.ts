// =====================================================
// Instantly API Client
// Wrapper for Instantly.ai API V2
// =====================================================

import { InstantlyCampaign, InstantlyAnalytics } from '@/lib/types/campaigns'

const INSTANTLY_API_BASE = 'https://api.instantly.ai/api/v2'

export class InstantlyClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Internal fetch wrapper with authentication
   */
  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${INSTANTLY_API_BASE}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Instantly API error (${response.status}): ${errorText}`)
    }

    return response.json()
  }

  /**
   * Get all campaigns
   * GET /campaigns
   */
  async getCampaigns(): Promise<InstantlyCampaign[]> {
    try {
      const data = await this.fetch('/campaigns')
      // The API returns campaigns in different formats, handle both
      return Array.isArray(data) ? data : (data.campaigns || [])
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
      throw error
    }
  }

  /**
   * Get single campaign by ID
   * GET /campaigns/:id
   */
  async getCampaign(campaignId: string): Promise<InstantlyCampaign> {
    try {
      const data = await this.fetch(`/campaigns/${campaignId}`)
      return data
    } catch (error) {
      console.error(`Failed to fetch campaign ${campaignId}:`, error)
      throw error
    }
  }

  /**
   * Get campaign analytics
   * GET /campaigns/analytics?ids=:id
   */
  async getCampaignAnalytics(campaignId: string): Promise<InstantlyAnalytics> {
    try {
      const data = await this.fetch(`/campaigns/analytics?ids=${campaignId}`)
      // API returns an array, get the first item
      if (Array.isArray(data) && data.length > 0) {
        return data[0]
      }
      return data
    } catch (error) {
      console.error(`Failed to fetch analytics for campaign ${campaignId}:`, error)
      throw error
    }
  }

  /**
   * Get step-level analytics for a campaign
   * GET /campaigns/analytics/steps?campaign_id=:id
   */
  async getCampaignStepAnalytics(campaignId: string): Promise<any[]> {
    try {
      const data = await this.fetch(`/campaigns/analytics/steps?campaign_id=${campaignId}`)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error(`Failed to fetch step analytics for campaign ${campaignId}:`, error)
      throw error
    }
  }

  /**
   * Test API connection
   * Returns true if API key is valid
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getCampaigns()
      return true
    } catch (error) {
      return false
    }
  }
}

/**
 * Get Instantly client instance with credentials from Supabase
 */
export async function getInstantlyClient(supabase: any): Promise<InstantlyClient> {
  const { data: credentials, error } = await supabase
    .from('instantly_credentials')
    .select('api_key')
    .eq('is_active', true)
    .single()

  if (error || !credentials) {
    throw new Error('No active Instantly API credentials found. Please configure API key in Settings.')
  }

  return new InstantlyClient(credentials.api_key)
}
