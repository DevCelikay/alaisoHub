'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ResourceWithTags, Tag } from '@/lib/types/database'
import { useUser } from '@/lib/hooks/useUser'

interface ResourceEditorProps {
  resource: ResourceWithTags | null
  tags: Tag[]
  onClose: () => void
}

export default function ResourceEditor({ resource, tags, onClose }: ResourceEditorProps) {
  const { user } = useUser()
  const [title, setTitle] = useState(resource?.title || '')
  const [description, setDescription] = useState(resource?.description || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(
    resource?.tags.map(t => t.id) || []
  )
  const [resourceType, setResourceType] = useState<'file' | 'url'>(resource?.resource_type || 'file')
  const [file, setFile] = useState<File | null>(null)
  const [fileData, setFileData] = useState(resource?.file_data || '')
  const [fileName, setFileName] = useState(resource?.file_name || '')
  const [fileType, setFileType] = useState(resource?.file_type || '')
  const [fileSize, setFileSize] = useState<number | null>(resource?.file_size || null)
  const [url, setUrl] = useState(resource?.url || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setFileName(selectedFile.name)
    setFileSize(selectedFile.size)

    // Extract file extension
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || ''
    setFileType(ext)

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setFileData(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (resourceType === 'file' && !resource && !fileData) {
      setError('File is required')
      return
    }

    if (resourceType === 'url' && !url.trim()) {
      setError('URL is required')
      return
    }

    if (resourceType === 'url') {
      try {
        new URL(url.trim())
      } catch {
        setError('Please enter a valid URL')
        return
      }
    }

    setSaving(true)
    setError(null)

    const supabase = createClient()

    try {
      const resourceData = {
        title: title.trim(),
        description: description.trim() || null,
        resource_type: resourceType,
        file_name: resourceType === 'file' ? fileName || null : null,
        file_type: resourceType === 'file' ? fileType || null : null,
        file_data: resourceType === 'file' ? fileData || null : null,
        file_size: resourceType === 'file' ? fileSize : null,
        url: resourceType === 'url' ? url.trim() : null,
        created_by: user?.id || null
      }

      let resourceId = resource?.id

      if (resource) {
        const { error: updateError } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', resource.id)

        if (updateError) throw updateError
      } else {
        const { data, error: insertError } = await supabase
          .from('resources')
          .insert(resourceData)
          .select()
          .single()

        if (insertError) throw insertError
        resourceId = data.id
      }

      // Update tags
      if (resourceId) {
        // Delete existing tag associations
        await supabase
          .from('resource_tags')
          .delete()
          .eq('resource_id', resourceId)

        // Insert new tag associations
        if (selectedTags.length > 0) {
          const tagAssociations = selectedTags.map(tagId => ({
            resource_id: resourceId,
            tag_id: tagId
          }))

          const { error: tagsError } = await supabase
            .from('resource_tags')
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
    if (!resource || !confirm('Are you sure you want to delete this resource?')) return

    setSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resource.id)

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
                placeholder="Enter resource title"
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
                        style={{
                          backgroundColor: tag.color,
                          color: 'white'
                        }}
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 border-dashed transition-all hover:border-solid"
                    style={{
                      borderColor: tag.color,
                      color: tag.color,
                      backgroundColor: `${tag.color}08`
                    }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {tag.name}
                  </button>
                ))}
                {tags.filter(tag => !selectedTags.includes(tag.id)).length === 0 && selectedTags.length > 0 && (
                  <span className="text-xs text-[#878787] italic">All tags selected</span>
                )}
              </div>
              {tags.length === 0 && (
                <span className="text-xs text-[#878787] italic">No tags available</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            {resource && (
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
            {/* Resource Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Resource Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResourceType('file')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg border transition-colors ${
                    resourceType === 'file'
                      ? 'bg-[#673ae4] text-white border-[#673ae4]'
                      : 'bg-white text-[#1a1a1a] border-[#e3e3e3] hover:border-[#673ae4]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    File Upload
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setResourceType('url')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg border transition-colors ${
                    resourceType === 'url'
                      ? 'bg-[#673ae4] text-white border-[#673ae4]'
                      : 'bg-white text-[#1a1a1a] border-[#e3e3e3] hover:border-[#673ae4]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    URL Link
                  </div>
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-white border border-[#e3e3e3] rounded-md text-[#1a1a1a] placeholder-[#b3b3b3] focus:outline-none focus:ring-2 focus:ring-[#673ae4] focus:border-transparent resize-none"
                placeholder="Brief description of the resource"
              />
            </div>

            {/* File Upload (shown when resource type is 'file') */}
            {resourceType === 'file' && (
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  File {!resource && <span className="text-red-500">*</span>}
                </label>
                {fileName && (
                  <div className="mb-3 p-3 bg-[#fafafa] border border-[#e3e3e3] rounded-md">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#673ae4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1a1a1a]">{fileName}</p>
                        {fileSize && (
                          <p className="text-xs text-[#878787]">
                            {(fileSize / 1024).toFixed(2)} KB
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#673ae4] hover:bg-[#f3f4ff] rounded-lg cursor-pointer transition-colors border border-[#673ae4]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {resource && resource.file_name ? 'Replace File' : 'Choose File'}
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-xs text-[#878787]">
                  Supported: PDF, Word, Text, Markdown, Images, etc.
                </p>
              </div>
            )}

            {/* URL Input (shown when resource type is 'url') */}
            {resourceType === 'url' && (
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  URL <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-[#878787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-white border border-[#e3e3e3] rounded-md text-[#1a1a1a] placeholder-[#b3b3b3] focus:outline-none focus:ring-2 focus:ring-[#673ae4] focus:border-transparent"
                      placeholder="https://example.com/resource"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-[#878787]">
                  Enter the full URL including https://
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
