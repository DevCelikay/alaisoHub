// =====================================================
// Variant Group Detail API Route
// GET /api/variant-groups/[id] - Get group with full comparison data
// DELETE /api/variant-groups/[id] - Delete variant group
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/variant-groups/[id]
 * Get variant group with full campaign details, sequences, and analytics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Fetch variant group with all related data
    const { data: group, error: groupError } = await supabase
      .from('variant_groups')
      .select(
        `
        *,
        variants:campaign_variants(
          id,
          variant_label,
          campaign:campaigns(
            *,
            sequences:campaign_sequences(*),
            analytics:campaign_analytics(*)
          )
        )
      `
      )
      .eq('id', id)
      .single()

    if (groupError) {
      if (groupError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Variant group not found' },
          { status: 404 }
        )
      }
      console.error('Failed to fetch variant group:', groupError)
      return NextResponse.json(
        { error: 'Failed to fetch variant group' },
        { status: 500 }
      )
    }

    // Transform data for easier consumption in UI
    const transformedGroup = {
      ...group,
      variants: group.variants?.map((variant) => ({
        variant_label: variant.variant_label,
        campaign: {
          ...variant.campaign,
          sequences: variant.campaign.sequences || [],
          analytics: variant.campaign.analytics?.[0] || null, // Get latest analytics
        },
      })) || [],
    }

    return NextResponse.json({
      success: true,
      group: transformedGroup,
    })
  } catch (error: any) {
    console.error('Variant group fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch variant group' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/variant-groups/[id]
 * Delete variant group (cascades to campaign_variants via RLS)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Check if group exists
    const { data: existingGroup, error: checkError } = await supabase
      .from('variant_groups')
      .select('id, name')
      .eq('id', id)
      .single()

    if (checkError || !existingGroup) {
      return NextResponse.json(
        { error: 'Variant group not found' },
        { status: 404 }
      )
    }

    // Delete the group (campaign_variants will be deleted via CASCADE)
    const { error: deleteError } = await supabase
      .from('variant_groups')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Failed to delete variant group:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete variant group' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Variant group "${existingGroup.name}" deleted successfully`,
    })
  } catch (error: any) {
    console.error('Variant group deletion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete variant group' },
      { status: 500 }
    )
  }
}
