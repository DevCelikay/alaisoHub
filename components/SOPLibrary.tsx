'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SOPWithTags, Tag, SOPStep } from '@/lib/types/database'
import SOPRow from './SOPRow'
import SOPEditor from './SOPEditor'
import { parseSOPFile, readFileAsText } from '@/lib/utils/sopParser'

interface SOPLibraryProps {
  isAdmin: boolean
  tagFilter?: string | null
  view?: 'all-sops'
}

export default function SOPLibrary({ isAdmin, tagFilter, view = 'all-sops' }: SOPLibraryProps) {
  const [sops, setSops] = useState<SOPWithTags[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSOP, setSelectedSOP] = useState<SOPWithTags | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadedSOPData, setUploadedSOPData] = useState<{
    title: string
    objectives: string
    logins_prerequisites: string
    steps: SOPStep[]
  } | null>(null)

  useEffect(() => {
    fetchSOPs()
    fetchTags()
  }, [])

  const fetchSOPs = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('sops')
      .select(`
        *,
        sop_tags (
          tag_id,
          tags (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (data && !error) {
      const sopsWithTags = data.map((sop: any) => ({
        ...sop,
        tags: sop.sop_tags?.map((st: any) => st.tags).filter(Boolean) || []
      }))
      setSops(sopsWithTags)
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

  const filteredSOPs = sops.filter(sop => {
    // Apply tag filter from sidebar
    if (tagFilter && !sop.tags.some(t => t.id === tagFilter)) {
      return false
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        sop.title.toLowerCase().includes(query) ||
        sop.objectives?.toLowerCase().includes(query) ||
        sop.tags.some(tag => tag.name.toLowerCase().includes(query))
      )
    }

    return true
  })

  // When tag filter is active, show all filtered SOPs in one list
  // When no tag filter, group by tags
  const groupedByTag = tagFilter
    ? []
    : tags.map(tag => ({
        tag,
        sops: filteredSOPs.filter(sop => sop.tags.some(t => t.id === tag.id))
      })).filter(group => group.sops.length > 0)

  const untaggedSOPs = filteredSOPs.filter(sop => sop.tags.length === 0)

  const handleCreate = () => {
    setSelectedSOP(null)
    setUploadedSOPData(null)
    setIsEditorOpen(true)
  }

  const handleEdit = (sop: SOPWithTags) => {
    setSelectedSOP(sop)
    setUploadedSOPData(null)
    setIsEditorOpen(true)
  }

  const handleEditWithData = (sop: SOPWithTags, data: { title: string; objectives: string; logins_prerequisites: string; steps: SOPStep[] }) => {
    setSelectedSOP(sop)
    setUploadedSOPData(data)
    setIsEditorOpen(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await readFileAsText(file)
      const parsedData = parseSOPFile(text, file.name)

      setUploadedSOPData(parsedData)
      setSelectedSOP(null)
      setIsEditorOpen(true)

      // Reset file input
      e.target.value = ''
    } catch (error) {
      console.error('Error parsing file:', error)
      alert('Failed to parse SOP file. Please check the format.')
    }
  }

  const handleClose = () => {
    setIsEditorOpen(false)
    setSelectedSOP(null)
    setUploadedSOPData(null)
    fetchSOPs()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#878787]">Loading SOPs...</div>
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
              placeholder="Search SOPs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#fafafa] border border-[#e3e3e3] rounded-lg text-[#1a1a1a] placeholder-[#878787] focus:outline-none focus:ring-2 focus:ring-[#673ae4] focus:border-transparent transition-all"
            />
          </div>
          {isAdmin && (
            <div className="flex items-center space-x-3 ml-4">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="px-5 py-2.5 bg-white hover:bg-[#fafafa] border border-[#e3e3e3] text-[#673ae4] font-medium rounded-lg transition-all">
                  Upload SOP
                </div>
              </label>
              <button
                onClick={handleCreate}
                className="px-5 py-2.5 bg-[#673ae4] hover:bg-[#5d0f4c] text-white font-medium rounded-lg transition-all shadow-sm hover:shadow"
              >
                + New SOP
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SOPs */}
      <div className="space-y-6">
        {/* If tag filter is active, show all filtered SOPs */}
        {tagFilter && filteredSOPs.length > 0 && (
          <div className="bg-white rounded-xl border border-[#e3e3e3] p-6">
            <div className="space-y-2">
              {filteredSOPs.map(sop => (
                <SOPRow
                  key={sop.id}
                  sop={sop}
                  onEdit={handleEdit}
                  onEditWithData={handleEditWithData}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        )}

        {/* Otherwise, group by tags */}
        {!tagFilter && groupedByTag.map(({ tag, sops }) => (
          <div key={tag.id} className="bg-white rounded-xl border border-[#e3e3e3] p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <h2 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide">
                {tag.name}
              </h2>
              <span className="text-xs text-[#878787] bg-[#fafafa] px-2 py-0.5 rounded-full">{sops.length}</span>
            </div>
            <div className="space-y-2">
              {sops.map(sop => (
                <SOPRow
                  key={sop.id}
                  sop={sop}
                  onEdit={handleEdit}
                  onEditWithData={handleEditWithData}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        ))}

        {!tagFilter && untaggedSOPs.length > 0 && (
          <div className="bg-white rounded-xl border border-[#e3e3e3] p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#878787]" />
              <h2 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide">
                Untagged
              </h2>
              <span className="text-xs text-[#878787] bg-[#fafafa] px-2 py-0.5 rounded-full">{untaggedSOPs.length}</span>
            </div>
            <div className="space-y-2">
              {untaggedSOPs.map(sop => (
                <SOPRow
                  key={sop.id}
                  sop={sop}
                  onEdit={handleEdit}
                  onEditWithData={handleEditWithData}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        )}

        {filteredSOPs.length === 0 && (
          <div className="bg-white rounded-xl border border-[#e3e3e3] p-12 text-center">
            <p className="text-[#878787]">
              {searchQuery ? 'No SOPs found matching your search.' : 'No SOPs yet. Create your first one!'}
            </p>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <SOPEditor
          sop={selectedSOP}
          tags={tags}
          onClose={handleClose}
          uploadedData={uploadedSOPData}
        />
      )}
    </div>
  )
}
