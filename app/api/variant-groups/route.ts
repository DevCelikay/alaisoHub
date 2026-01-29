// =====================================================
// Variant Groups API Route
// GET /api/variant-groups - List all variant groups
// POST /api/variant-groups - Create new variant group
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/variant-groups
 * List all variant groups with campaign counts
 */
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

    // Fetch variant groups with campaign counts
    const { data: groups, error: groupsError } = await supabase
      .from('variant_groups')
      .select(
        `
        *,
        variants:campaign_variants(
          id,
          variant_label,
          campaign:campaigns(
            id,
            name,
            status
          )
        )
      `
      )
      .order('created_at', { ascending: false })

    if (groupsError) {
      console.error('Failed to fetch variant groups:', groupsError)
      return NextResponse.json(
        { error: 'Failed to fetch variant groups' },
        { status: 500 }
      )
    }

    // Transform data to include campaign count
    const transformedGroups = groups?.map((group) => ({
      ...group,
      campaign_count: group.variants?.length || 0,
      variants: group.variants || [],
    }))

    return NextResponse.json({
      success: true,
      groups: transformedGroups || [],
      total: transformedGroups?.length || 0,
    })
  } catch (error: any) {
    console.error('Variant groups fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch variant groups' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/variant-groups
 * Create new variant group with campaigns
 * Body: { name: string, description?: string, campaign_ids: string[] }
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { name, description, campaign_ids } = body

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string' },
        { status: 400 }
      )
    }

    if (!campaign_ids || !Array.isArray(campaign_ids) || campaign_ids.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 campaigns are required for comparison' },
        { status: 400 }
      )
    }

    // Create variant group
    const { data: group, error: groupError } = await supabase
      .from('variant_groups')
      .insert({
        name,
        description: description || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (groupError || !group) {
      console.error('Failed to create variant group:', groupError)
      return NextResponse.json(
        { error: 'Failed to create variant group' },
        { status: 500 }
      )
    }

    // Create campaign variants with labels (A, B, C, etc.)
    const variantLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    const variantsToInsert = campaign_ids.map((campaign_id, index) => ({
      variant_group_id: group.id,
      campaign_id,
      variant_label: `Variant ${variantLabels[index] || index + 1}`,
    }))

    const { error: variantsError } = await supabase
      .from('campaign_variants')
      .insert(variantsToInsert)

    if (variantsError) {
      console.error('Failed to create campaign variants:', variantsError)
      // Rollback: delete the group
      await supabase.from('variant_groups').delete().eq('id', group.id)
      return NextResponse.json(
        { error: 'Failed to create campaign variants' },
        { status: 500 }
      )
    }

    // Fetch the complete group with variants
    const { data: completeGroup, error: fetchError } = await supabase
      .from('variant_groups')
      .select(
        `
        *,
        variants:campaign_variants(
          id,
          variant_label,
          campaign:campaigns(
            id,
            name,
            status
          )
        )
      `
      )
      .eq('id', group.id)
      .single()

    if (fetchError) {
      console.error('Failed to fetch created group:', fetchError)
      return NextResponse.json(
        { error: 'Group created but failed to fetch details' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      group: completeGroup,
    })
  } catch (error: any) {
    console.error('Variant group creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create variant group' },
      { status: 500 }
    )
  }
}
