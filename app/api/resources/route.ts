import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Create a new resource (admin only)
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    title,
    description,
    resource_type,
    file_name,
    file_type,
    file_data,
    file_size,
    url,
    tag_ids
  } = body as {
    title?: string
    description?: string | null
    resource_type?: 'file' | 'url'
    file_name?: string | null
    file_type?: string | null
    file_data?: string | null
    file_size?: number | null
    url?: string | null
    tag_ids?: string[]
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const type = resource_type === 'url' ? 'url' : 'file'
  if (type === 'file' && !file_data && !file_name) {
    return NextResponse.json({ error: 'File is required for file resources' }, { status: 400 })
  }
  if (type === 'url') {
    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'URL is required for url resources' }, { status: 400 })
    }
    try {
      new URL(url.trim())
    } catch {
      return NextResponse.json({ error: 'Please enter a valid URL' }, { status: 400 })
    }
  }

  const resourceData = {
    title: title.trim(),
    description: description && typeof description === 'string' ? description.trim() || null : null,
    resource_type: type,
    file_name: type === 'file' ? (file_name ?? null) : null,
    file_type: type === 'file' ? (file_type ?? null) : null,
    file_data: type === 'file' ? (file_data ?? null) : null,
    file_size: type === 'file' ? file_size ?? null : null,
    url: type === 'url' ? (url as string).trim() : null,
    created_by: user.id
  }

  const { data: resource, error: insertError } = await supabase
    .from('resources')
    .insert(resourceData)
    .select()
    .single()

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    )
  }

  const tagIds = Array.isArray(tag_ids) ? tag_ids.filter((id): id is string => typeof id === 'string') : []
  if (tagIds.length > 0) {
    const tagRows = tagIds.map(tag_id => ({ resource_id: resource.id, tag_id }))
    const { error: tagsError } = await supabase.from('resource_tags').insert(tagRows)
    if (tagsError) {
      return NextResponse.json(
        { error: `Resource created but tags failed: ${tagsError.message}` },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(resource)
}
