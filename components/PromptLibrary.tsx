'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PromptWithTags, Tag } from '@/lib/types/database'
import PromptRow from './PromptRow'
import PromptEditor from './PromptEditor'

interface PromptLibraryProps {
  isAdmin: boolean
  tagFilter?: string | null
  view?: 'all-prompts'
}

export default function PromptLibrary({ isAdmin, tagFilter, view = 'all-prompts' }: PromptLibraryProps) {
  const [prompts, setPrompts] = useState<PromptWithTags[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithTags | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPrompts()
    fetchTags()
  }, [])

  const fetchPrompts = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        prompt_tags (
          tag_id,
          tags (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (data && !error) {
      const promptsWithTags = data.map((prompt: any) => ({
        ...prompt,
        tags: prompt.prompt_tags?.map((pt: any) => pt.tags).filter(Boolean) || []
      }))
      setPrompts(promptsWithTags)
    }
    setLoading(false)
  }

  const fetchTags = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('tags')
      .select('*')
      .order('name')
    if (data) setTags(data)
  }

  const filteredPrompts = prompts.filter(prompt => {
    // Apply tag filter from sidebar
    if (tagFilter && !prompt.tags.some(t => t.id === tagFilter)) {
      return false
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        prompt.title.toLowerCase().includes(query) ||
        prompt.description?.toLowerCase().includes(query) ||
        prompt.content.toLowerCase().includes(query) ||
        prompt.tags.some(tag => tag.name.toLowerCase().includes(query))
      )
    }

    return true
  })

  // When tag filter is active, show all filtered prompts in one list
  // When no tag filter, group by tags
  const groupedByTag = tagFilter
    ? []
    : tags.map(tag => ({
        tag,
        prompts: filteredPrompts.filter(prompt => prompt.tags.some(t => t.id === tag.id))
      })).filter(group => group.prompts.length > 0)

  const untaggedPrompts = filteredPrompts.filter(prompt => prompt.tags.length === 0)

  const handleCreate = () => {
    setSelectedPrompt(null)
    setIsEditorOpen(true)
  }

  const handleEdit = (prompt: PromptWithTags) => {
    setSelectedPrompt(prompt)
    setIsEditorOpen(true)
  }

  const handleClose = () => {
    setIsEditorOpen(false)
    setSelectedPrompt(null)
    fetchPrompts()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#878787]">Loading prompts...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-[#e3e3e3] p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#fafafa] border border-[#e3e3e3] rounded-lg text-[#1a1a1a] placeholder-[#878787] focus:outline-none focus:ring-2 focus:ring-[#673ae4] focus:border-transparent transition-all"
            />
          </div>
          {isAdmin && (
            <button
              onClick={handleCreate}
              className="ml-4 px-5 py-2.5 bg-[#673ae4] hover:bg-[#5d0f4c] text-white font-medium rounded-lg transition-all shadow-sm hover:shadow"
            >
              + New Prompt
            </button>
          )}
        </div>
      </div>

      {/* Prompts */}
      <div className="space-y-6">
        {/* If tag filter is active, show all filtered prompts */}
        {tagFilter && filteredPrompts.length > 0 && (
          <div className="bg-white rounded-xl border border-[#e3e3e3] p-6">
            <div className="space-y-2">
              {filteredPrompts.map(prompt => (
                <PromptRow
                  key={prompt.id}
                  prompt={prompt}
                  onEdit={handleEdit}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        )}

        {/* Otherwise, group by tags */}
        {!tagFilter && groupedByTag.map(({ tag, prompts }) => (
          <div key={tag.id} className="bg-white rounded-xl border border-[#e3e3e3] p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <h2 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide">
                {tag.name}
              </h2>
              <span className="text-xs text-[#878787] bg-[#fafafa] px-2 py-0.5 rounded-full">{prompts.length}</span>
            </div>
            <div className="space-y-2">
              {prompts.map(prompt => (
                <PromptRow
                  key={prompt.id}
                  prompt={prompt}
                  onEdit={handleEdit}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        ))}

        {!tagFilter && untaggedPrompts.length > 0 && (
          <div className="bg-white rounded-xl border border-[#e3e3e3] p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#878787]" />
              <h2 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide">
                Untagged
              </h2>
              <span className="text-xs text-[#878787] bg-[#fafafa] px-2 py-0.5 rounded-full">{untaggedPrompts.length}</span>
            </div>
            <div className="space-y-2">
              {untaggedPrompts.map(prompt => (
                <PromptRow
                  key={prompt.id}
                  prompt={prompt}
                  onEdit={handleEdit}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        )}

        {filteredPrompts.length === 0 && (
          <div className="bg-white rounded-xl border border-[#e3e3e3] p-12 text-center">
            <p className="text-[#878787]">
              {searchQuery ? 'No prompts found matching your search.' : 'No prompts yet. Create your first one!'}
            </p>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <PromptEditor
          prompt={selectedPrompt}
          tags={tags}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
