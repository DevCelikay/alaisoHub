'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PromptWithTags, Tag } from '@/lib/types/database'
import { useUser } from '@/lib/hooks/useUser'

interface PromptEditorProps {
  prompt: PromptWithTags | null
  tags: Tag[]
  onClose: () => void
}

export default function PromptEditor({ prompt, tags, onClose }: PromptEditorProps) {
  const { user } = useUser()
  const [title, setTitle] = useState(prompt?.title || '')
  const [description, setDescription] = useState(prompt?.description || '')
  const [content, setContent] = useState(prompt?.content || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(
    prompt?.tags.map(t => t.id) || []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!content.trim()) {
      setError('Content is required')
      return
    }

    setSaving(true)
    setError(null)

    const supabase = createClient()

    try {
      const promptData = {
        title: title.trim(),
        description: description.trim() || null,
        content: content.trim(),
        created_by: user?.id
      }

      let promptId = prompt?.id

      if (prompt) {
        // Update existing prompt
        const { error: updateError } = await supabase
          .from('prompts')
          .update(promptData)
          .eq('id', prompt.id)

        if (updateError) throw updateError
      } else {
        // Create new prompt
        const { data, error: insertError } = await supabase
          .from('prompts')
          .insert(promptData)
          .select()
          .single()

        if (insertError) throw insertError
        promptId = data.id
      }

      // Update tags
      if (promptId) {
        // Delete existing tag associations
        await supabase
          .from('prompt_tags')
          .delete()
          .eq('prompt_id', promptId)

        // Insert new tag associations
        if (selectedTags.length > 0) {
          const tagAssociations = selectedTags.map(tagId => ({
            prompt_id: promptId,
            tag_id: tagId
          }))

          const { error: tagsError } = await supabase
            .from('prompt_tags')
            .insert(tagAssociations)

          if (tagsError) throw tagsError
        }
      }

      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!prompt || !confirm('Are you sure you want to delete this prompt?')) return

    setSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', prompt.id)

      if (error) throw error
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-[#e3e3e3]">
        <div className="max-w-5xl mx-auto w-full px-4 py-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#878787] uppercase tracking-wide mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl font-semibold text-[#1a1a1a] bg-white border border-[#e3e3e3] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#673ae4] focus:border-transparent"
                placeholder="Enter prompt title"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#878787] uppercase tracking-wide mb-2">
                Tags
              </label>
              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map(tagId => {
                    const tag = tags.find(t => t.id === tagId)
                    if (!tag) return null
                    return (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: tag.color, color: 'white' }}
                      >
                        {tag.name}
                        <button
                          onClick={() => toggleTag(tag.id)}
                          className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
              {/* Available Tags */}
              <div className="flex flex-wrap gap-2">
                {tags.filter(tag => !selectedTags.includes(tag.id)).map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 border-dashed hover:border-solid transition-all"
                    style={{ borderColor: tag.color, color: tag.color }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {tag.name}
                  </button>
                ))}
              </div>
              {tags.length === 0 && (
                <p className="text-xs text-[#878787]">No tags available</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            {prompt && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              disabled={saving}
              className="px-3 py-2 text-sm text-[#878787] hover:bg-[#fafafa] rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-2 bg-[#673ae4] hover:bg-[#5d0f4c] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full px-4 py-4">
          {error && (
            <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-[#e3e3e3] rounded-md text-[#1a1a1a] placeholder-[#b3b3b3] focus:outline-none focus:ring-2 focus:ring-[#673ae4] focus:border-transparent resize-none"
                placeholder="Brief description of the prompt"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Prompt Content *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 bg-white border border-[#e3e3e3] rounded-md text-[#1a1a1a] placeholder-[#b3b3b3] focus:outline-none focus:ring-2 focus:ring-[#673ae4] focus:border-transparent resize-none font-mono text-sm"
                placeholder="Enter the prompt content..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
