import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// GET - List all invitations (admin only)
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use admin client to bypass RLS
  const adminSupabase = createAdminClient()

  // Check if user is admin
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: invitations, error } = await adminSupabase
    .from('invitations')
    .select(`
      *,
      inviter:invited_by(email, full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(invitations)
}

// POST - Create a new invitation (admin only)
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use admin client to bypass RLS
  const adminSupabase = createAdminClient()

  // Check if user is admin
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, role = 'viewer' } = body

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Check if email already has a user account
  const { data: existingProfile } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingProfile) {
    return NextResponse.json(
      { error: 'A user with this email already exists' },
      { status: 400 }
    )
  }

  // Check for existing pending invitation
  const { data: existingInvitation } = await adminSupabase
    .from('invitations')
    .select('id')
    .eq('email', email)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (existingInvitation) {
    return NextResponse.json(
      { error: 'A pending invitation already exists for this email' },
      { status: 400 }
    )
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex')

  // Set expiration to 7 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data: invitation, error } = await adminSupabase
    .from('invitations')
    .insert({
      email,
      role,
      token,
      invited_by: user.id,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Generate invitation link
  const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL
  const invitationLink = `${baseUrl}/invite/${token}`

  return NextResponse.json({
    ...invitation,
    invitationLink
  })
}

// DELETE - Delete an invitation (admin only)
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use admin client to bypass RLS
  const adminSupabase = createAdminClient()

  // Check if user is admin
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 })
  }

  const { error } = await adminSupabase
    .from('invitations')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
