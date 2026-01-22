'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Tag } from '@/lib/types/database'

const PRESET_COLORS = [
  '#673ae4', // Purple (primary)
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
]

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [tagUsage, setTagUsage] = useState<Record<string, { sops: number; prompts: number }>>({})
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const supabase = createClient()

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/')
        return
      }

      setIsAdmin(true)
      await fetchTags()
      setLoading(false)
    }

    checkAuthAndFetch()
  }, [router])

  const fetchTags = async () => {
    const supabase = createClient()

    const { data: tagsData } = await supabase
      .from('tags')
      .select('*')
      .order('name')

    if (tagsData) {
      setTags(tagsData)

      // Fetch usage counts for each tag
      const usage: Record<string, { sops: number; prompts: number }> = {}

      for (const tag of tagsData) {
        const { count: sopCount } = await supabase
          .from('sop_tags')
          .select('*', { count: 'exact', head: true })
          .eq('tag_id', tag.id)

        const { count: promptCount } = await supabase
          .from('prompt_tags')
          .select('*', { count: 'exact', head: true })
          .eq('tag_id', tag.id)

        usage[tag.id] = {
          sops: sopCount || 0,
          prompts: promptCount || 0
        }
      }

      setTagUsage(usage)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    const supabase = createClient()
    const { error } = await supabase
      .from('tags')
      .insert({ name: newTagName.trim(), color: newTagColor })

    if (!error) {
      setNewTagName('')
      setNewTagColor(PRESET_COLORS[0])
      await fetchTags()
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTag || !editName.trim()) return

    const supabase = createClient()
    const { error } = await supabase
      .from('tags')
      .update({ name: editName.trim(), color: editColor })
      .eq('id', editingTag.id)

    if (!error) {
      setEditingTag(null)
      await fetchTags()
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    const supabase = createClient()

    // Delete tag associations first
    await supabase.from('sop_tags').delete().eq('tag_id', tagId)
    await supabase.from('prompt_tags').delete().eq('tag_id', tagId)

    // Then delete the tag
    const { error } = await supabase.from('tags').delete().eq('id', tagId)

    if (!error) {
      setDeleteConfirm(null)
      await fetchTags()
    }
  }

  const startEditing = (tag: Tag) => {
    setEditingTag(tag)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="text-[#878787]">Loading...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 text-[#878787] hover:bg-white hover:text-[#1a1a1a] rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold text-[#1a1a1a]">Manage Tags</h1>
          </div>
          <span className="text-sm text-[#878787]">{tags.length} tags</span>
        </div>

        {/* Create New Tag */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">Create New Tag</h2>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#878787] mb-2">Tag Name</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#e3e3e3] focus:border-[#673ae4] focus:ring-1 focus:ring-[#673ae4] outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#878787] mb-2">Color</label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      newTagColor === color ? 'ring-2 ring-offset-2 ring-[#673ae4]' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleCreateTag}
              disabled={!newTagName.trim()}
              className="px-6 py-2.5 bg-[#673ae4] hover:bg-[#5d0f4c] disabled:bg-[#e3e3e3] text-white disabled:text-[#878787] rounded-xl transition-all font-medium"
            >
              Create
            </button>
          </div>
          {/* Preview */}
          {newTagName && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-[#878787]">Preview:</span>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${newTagColor}15`, color: newTagColor }}
              >
                {newTagName}
              </span>
            </div>
          )}
        </div>

        {/* Tags List */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e3e3e3]">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">All Tags</h2>
          </div>

          {tags.length === 0 ? (
            <div className="p-12 text-center text-[#878787]">
              No tags yet. Create your first tag above.
            </div>
          ) : (
            <div className="divide-y divide-[#e3e3e3]">
              {tags.map((tag) => (
                <div key={tag.id} className="px-6 py-4">
                  {editingTag?.id === tag.id ? (
                    // Edit Mode
                    <div className="flex items-center gap-4">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl border border-[#e3e3e3] focus:border-[#673ae4] focus:ring-1 focus:ring-[#673ae4] outline-none"
                        autoFocus
                      />
                      <div className="flex items-center gap-1">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditColor(color)}
                            className={`w-6 h-6 rounded-md transition-all ${
                              editColor === color ? 'ring-2 ring-offset-1 ring-[#673ae4]' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={handleUpdateTag}
                        className="px-4 py-2 text-sm bg-[#673ae4] hover:bg-[#5d0f4c] text-white rounded-xl transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTag(null)}
                        className="px-4 py-2 text-sm text-[#878787] hover:bg-[#fafafa] rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : deleteConfirm === tag.id ? (
                    // Delete Confirmation
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#1a1a1a]">
                          Delete <strong>{tag.name}</strong>?
                        </p>
                        <p className="text-xs text-[#878787]">
                          This will remove it from {tagUsage[tag.id]?.sops || 0} SOPs and {tagUsage[tag.id]?.prompts || 0} prompts.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-4 py-2 text-sm text-[#878787] hover:bg-[#fafafa] rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal View
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
                        >
                          {tag.name}
                        </span>
                        <span className="text-xs text-[#878787]">
                          {tagUsage[tag.id]?.sops || 0} SOPs, {tagUsage[tag.id]?.prompts || 0} prompts
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditing(tag)}
                          className="p-2 text-[#878787] hover:text-[#673ae4] hover:bg-[#f3f4ff] rounded-xl transition-all"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(tag.id)}
                          className="p-2 text-[#878787] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
