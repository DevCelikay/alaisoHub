'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SOPWithTags, Tag, SOPStep, StepImage, StepType } from '@/lib/types/database'
import { useUser } from '@/lib/hooks/useUser'

interface SOPEditorProps {
  sop: SOPWithTags | null
  tags: Tag[]
  onClose: () => void
  uploadedData?: {
    title: string
    objectives: string
    logins_prerequisites: string
    steps: SOPStep[]
  } | null
}

export default function SOPEditor({ sop, tags, onClose, uploadedData }: SOPEditorProps) {
  const { user } = useUser()
  const [title, setTitle] = useState(uploadedData?.title || sop?.title || '')
  const [objectives, setObjectives] = useState(uploadedData?.objectives || sop?.objectives || '')
  const [logins, setLogins] = useState(uploadedData?.logins_prerequisites || sop?.logins_prerequisites || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(
    sop?.tags.map(t => t.id) || []
  )
  const [steps, setSteps] = useState<SOPStep[]>(
    uploadedData?.steps || (sop?.content as unknown as SOPStep[]) || []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedImage, setExpandedImage] = useState<{ data: string; caption?: string } | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expandedImage) {
          setExpandedImage(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, expandedImage])

  const addStep = () => {
    const newStep: SOPStep = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      order: steps.length
    }
    setSteps([...steps, newStep])
  }

  const updateStep = (id: string, field: keyof SOPStep, value: string | StepType) => {
    setSteps(steps.map(step =>
      step.id === id ? { ...step, [field]: value } : step
    ))
  }

  const removeStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id).map((step, index) => ({
      ...step,
      order: index
    })))
  }

  const moveStep = (id: string, direction: 'up' | 'down') => {
    const index = steps.findIndex(step => step.id === id)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return
    }

    const newSteps = [...steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]

    setSteps(newSteps.map((step, i) => ({ ...step, order: i })))
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const addImageToStep = (stepId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const newImage: StepImage = {
        id: crypto.randomUUID(),
        data: dataUrl,
        caption: ''
      }
      setSteps(steps.map(step =>
        step.id === stepId
          ? { ...step, images: [...(step.images || []), newImage] }
          : step
      ))
    }
    reader.readAsDataURL(file)
  }

  const removeImageFromStep = (stepId: string, imageId: string) => {
    setSteps(steps.map(step =>
      step.id === stepId
        ? { ...step, images: (step.images || []).filter(img => img.id !== imageId) }
        : step
    ))
  }

  const updateImageCaption = (stepId: string, imageId: string, caption: string) => {
    setSteps(steps.map(step =>
      step.id === stepId
        ? {
            ...step,
            images: (step.images || []).map(img =>
              img.id === imageId ? { ...img, caption } : img
            )
          }
        : step
    ))
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setSaving(true)
    setError(null)

    const supabase = createClient()

    try {
      const sopData = {
        title: title.trim(),
        objectives: objectives.trim() || null,
        logins_prerequisites: logins.trim() || null,
        content: steps,
        created_by: user?.id
      }

      let sopId = sop?.id

      if (sop) {
        // Update existing SOP
        const { error: updateError } = await supabase
          .from('sops')
          .update(sopData)
          .eq('id', sop.id)

        if (updateError) throw updateError
      } else {
        // Create new SOP
        const { data, error: insertError } = await supabase
          .from('sops')
          .insert(sopData)
          .select()
          .single()

        if (insertError) throw insertError
        sopId = data.id
      }

      // Update tags
      if (sopId) {
        // Delete existing tag associations
        await supabase
          .from('sop_tags')
          .delete()
          .eq('sop_id', sopId)

        // Insert new tag associations
        if (selectedTags.length > 0) {
          const tagAssociations = selectedTags.map(tagId => ({
            sop_id: sopId,
            tag_id: tagId
          }))

          const { error: tagsError } = await supabase
            .from('sop_tags')
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
    if (!sop || !confirm('Are you sure you want to delete this SOP?')) return

    setSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('sops')
        .delete()
        .eq('id', sop.id)

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
                placeholder="Enter SOP title"
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
            {sop && (
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
            {/* Objectives */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Objectives and Outcomes
              </label>
              <textarea
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-white border border-[#e3e3e3] rounded-md text-[#1a1a1a] placeholder-[#b3b3b3] focus:outline-none focus:ring-2 focus:ring-[#673ae4] focus:border-transparent resize-none"
                placeholder="What are the goals and expected outcomes?"
              />
            </div>

            {/* Logins and Prerequisites */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Logins and Prerequisites
              </label>
              <textarea
                value={logins}
                onChange={(e) => setLogins(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-white border border-[#e3e3e3] rounded-md text-[#1a1a1a] placeholder-[#b3b3b3] focus:outline-none focus:ring-2 focus:ring-[#673ae4] focus:border-transparent resize-none"
                placeholder="Required logins, access, tools, or prerequisites"
              />
            </div>

            {/* Steps */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-[#1a1a1a]">
                  Steps
                </label>
                <button
                  onClick={addStep}
                  className="text-sm text-[#673ae4] hover:text-[#5d0f4c] transition-colors"
                >
                  + Add Step
                </button>
              </div>

              <div className="space-y-4">
                {steps.map((step, index) => {
                  const isDecision = step.type === 'decision'
                  return (
                  <div
                    key={step.id}
                    className={`rounded-lg p-4 ${
                      isDecision
                        ? 'bg-[#f0f7ff] border-2 border-[#3b82f6]'
                        : 'bg-[#fafafa] border border-[#e3e3e3]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${isDecision ? 'text-[#3b82f6]' : 'text-[#878787]'}`}>
                          Step {index + 1}
                        </span>
                        <button
                          onClick={() => updateStep(step.id, 'type', isDecision ? 'standard' : 'decision')}
                          className={`text-xs px-2 py-1 rounded-full transition-colors ${
                            isDecision
                              ? 'bg-[#3b82f6] text-white'
                              : 'bg-[#e3e3e3] text-[#878787] hover:bg-[#d1d1d1]'
                          }`}
                        >
                          {isDecision ? '✓ Decision' : 'Decision'}
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => moveStep(step.id, 'up')}
                          disabled={index === 0}
                          className="text-[#878787] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveStep(step.id, 'down')}
                          disabled={index === steps.length - 1}
                          className="text-[#878787] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeStep(step.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                      placeholder="Step title"
                      className="w-full px-3 py-2 mb-2 bg-white border border-[#e3e3e3] rounded-md text-[#1a1a1a] placeholder-[#b3b3b3] focus:outline-none focus:ring-2 focus:ring-[#673ae4] focus:border-transparent"
                    />
                    <textarea
                      value={step.content}
                      onChange={(e) => updateStep(step.id, 'content', e.target.value)}
                      rows={3}
                      placeholder="Step content"
                      className="w-full px-3 py-2 bg-white border border-[#e3e3e3] rounded-md text-[#1a1a1a] placeholder-[#b3b3b3] focus:outline-none focus:ring-2 focus:ring-[#673ae4] focus:border-transparent resize-none"
                    />

                    {/* Images */}
                    {step.images && step.images.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {step.images.map((image) => (
                          <div key={image.id} className="relative bg-white border border-[#e3e3e3] rounded-md p-2">
                            <img
                              src={image.data}
                              alt={image.caption || 'Step image'}
                              className="max-w-full max-h-64 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setExpandedImage({ data: image.data, caption: image.caption })}
                              title="Click to expand"
                            />
                            <input
                              type="text"
                              value={image.caption || ''}
                              onChange={(e) => updateImageCaption(step.id, image.id, e.target.value)}
                              placeholder="Image caption (optional)"
                              className="w-full mt-2 px-2 py-1 text-sm bg-[#fafafa] border border-[#e3e3e3] rounded text-[#1a1a1a] placeholder-[#b3b3b3] focus:outline-none focus:ring-1 focus:ring-[#673ae4]"
                            />
                            <button
                              onClick={() => removeImageFromStep(step.id, image.id)}
                              className="absolute top-3 right-3 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                              title="Remove image"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Image Button */}
                    <div className="mt-3">
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-[#673ae4] hover:bg-[#f3f4ff] rounded-md cursor-pointer transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Add Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              addImageToStep(step.id, file)
                              e.target.value = '' // Reset to allow re-selecting same file
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  )
                })}

                {steps.length === 0 && (
                  <div className="text-center py-8 text-[#878787]">
                    No steps yet. Click "Add Step" to create one.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={expandedImage.data}
              alt={expandedImage.caption || 'Expanded image'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {expandedImage.caption && (
              <p className="mt-3 text-center text-white/90 text-sm">{expandedImage.caption}</p>
            )}
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#1a1a1a] hover:bg-gray-100 transition-colors shadow-lg"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
