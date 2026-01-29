// =====================================================
// API Route: Instantly Credentials Management
// GET - Get active credentials (admin only)
// POST - Set API key (admin only)
// =====================================================

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { InstantlyClient } from '@/lib/instantly/client'

/**
 * GET /api/instantly/credentials
 * Get active Instantly API credentials (masked for security)
 */
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  const { data: credentials, error } = await supabase
    .from('instantly_credentials')
    .select('id, created_at, updated_at, is_active')
    .eq('is_active', true)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(credentials || null)
}

/**
 * POST /api/instantly/credentials
 * Set Instantly API key
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { api_key, key_name } = body

  if (!api_key || typeof api_key !== 'string') {
    return NextResponse.json(
      { error: 'API key is required' },
      { status: 400 }
    )
  }

  // Test API key validity
  const testClient = new InstantlyClient(api_key)
  const isValid = await testClient.testConnection()

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid API key - failed to connect to Instantly API' },
      { status: 400 }
    )
  }

  // Insert new credentials (keep existing keys active)
  const { data: credentials, error } = await supabase
    .from('instantly_credentials')
    .insert({
      api_key,
      key_name: key_name || null,
      created_by: user.id,
      is_active: true,
    })
    .select('id, created_at, is_active, key_name')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    credentials: {
      id: credentials.id,
      created_at: credentials.created_at,
      is_active: credentials.is_active,
      key_name: credentials.key_name
    }
  })
}
