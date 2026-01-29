// =====================================================
// Sync History API Route
// GET /api/sync-history - Get recent sync operations
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Fetch sync history
    const { data: history, error: historyError } = await supabase
      .from('sync_history')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit)

    if (historyError) {
      console.error('Failed to fetch sync history:', historyError)
      return NextResponse.json(
        { error: 'Failed to fetch sync history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      history: history || [],
      total: history?.length || 0,
    })
  } catch (error: any) {
    console.error('Sync history fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sync history' },
      { status: 500 }
    )
  }
}
