// =====================================================
// Campaigns API Route
// GET /api/campaigns - List all campaigns with analytics
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('campaigns')
      .select(
        `
        *,
        steps:steps(*),
        credential:instantly_credentials(id, key_name)
      `
      )
      .order('last_synced_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: campaigns, error: campaignsError } = await query

    if (campaignsError) {
      console.error('Failed to fetch campaigns:', campaignsError)
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      )
    }

    // Transform data to match CampaignWithRelations type
    const transformedCampaigns = campaigns?.map((campaign) => ({
      ...campaign,
      steps: campaign.steps || [],
    }))

    return NextResponse.json({
      success: true,
      campaigns: transformedCampaigns || [],
      total: transformedCampaigns?.length || 0,
    })
  } catch (error: any) {
    console.error('Campaigns fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}
