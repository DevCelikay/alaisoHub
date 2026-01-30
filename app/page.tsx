'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import Sidebar from '@/components/Sidebar'
import SOPViewer from '@/components/SOPViewer'
import PromptViewer from '@/components/PromptViewer'
import SOPEditor from '@/components/SOPEditor'
import PromptEditor from '@/components/PromptEditor'
import ResourceEditor from '@/components/ResourceEditor'
import ResourceViewer from '@/components/ResourceViewer'
import ReportingDashboard from '@/components/campaigns/ReportingDashboard'
import UploadModal from '@/components/UploadModal'
import { Tag, SOPWithTags, PromptWithTags, ResourceWithTags, SOPStep } from '@/lib/types/database'
import { addRecentView, getRecentViews, RecentView } from '@/lib/utils/recentViews'

type App = 'reporting' | 'knowledge-base' | 'copywriting'
type View = 'all-sops' | 'all-prompts' | 'all-resources'

export default function Home() {
  const [activeApp, setActiveApp] = useState<App>('knowledge-base')
  const [activeView, setActiveView] = useState<View>('all-sops')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedItemType, setSelectedItemType] = useState<'sop' | 'prompt' | 'resource' | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tags, setTags] = useState<Tag[]>([])
  const [sops, setSops] = useState<SOPWithTags[]>([])
  const [prompts, setPrompts] = useState<PromptWithTags[]>([])
  const [resources, setResources] = useState<ResourceWithTags[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [recentViews, setRecentViews] = useState<RecentView[]>([])
  const [uploadedSOPData, setUploadedSOPData] = useState<{
    title: string
    objectives: string
    logins_prerequisites: string
    steps: SOPStep[]
  } | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [sopsExpanded, setSopsExpanded] = useState(true)
  const [promptsExpanded, setPromptsExpanded] = useState(false)
  const [resourcesExpanded, setResourcesExpanded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/login')
          return
        }

        setUser(user)

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email!,
              is_admin: false,
              role: 'viewer'
            })
            .select()
            .single()

          setProfile(newProfile)
        } else {
          setProfile(profile)
        }

        // Fetch all data for sidebar
        await fetchAllData()

        // Load recent views
        setRecentViews(getRecentViews())

      } catch (err) {
        console.error('Auth error:', err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const fetchAllData = async () => {
    const supabase = createClient()

    // Fetch tags
    const { data: tagsData } = await supabase.from('tags').select('*').order('name')
    if (tagsData) setTags(tagsData)

    // Fetch SOPs with tags
    const { data: sopsData } = await supabase
      .from('sops')
      .select(`
        *,
        sop_tags (
          tag_id,
          tags (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (sopsData) {
      const sopsWithTags = sopsData.map((sop: any) => ({
        ...sop,
        tags: sop.sop_tags?.map((st: any) => st.tags).filter(Boolean) || []
      }))
      setSops(sopsWithTags)
    }

    // Fetch Prompts with tags
    const { data: promptsData } = await supabase
      .from('prompts')
      .select(`
        *,
        prompt_tags (
          tag_id,
          tags (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (promptsData) {
      const promptsWithTags = promptsData.map((prompt: any) => ({
        ...prompt,
        tags: prompt.prompt_tags?.map((pt: any) => pt.tags).filter(Boolean) || []
      }))
      setPrompts(promptsWithTags)
    }

    // Fetch Resources with tags
    const { data: resourcesData } = await supabase
      .from('resources')
      .select(`
        *,
        resource_tags (
          tag_id,
          tags (*)
        )
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (resourcesData) {
      const resourcesWithTags = resourcesData.map((resource: any) => ({
        ...resource,
        tags: resource.resource_tags?.map((rt: any) => rt.tags).filter(Boolean) || []
      }))
      setResources(resourcesWithTags)
    }
  }

  const handleItemSelect = (itemId: string, itemType: 'sop' | 'prompt' | 'resource') => {
    setSelectedItemId(itemId)
    setSelectedItemType(itemType)
    setIsEditing(false)
    setUploadedSOPData(null)

    // Track recent view
    let title = ''
    if (itemType === 'sop') {
      const item = sops.find(s => s.id === itemId)
      title = item?.title || ''
    } else if (itemType === 'prompt') {
      const item = prompts.find(p => p.id === itemId)
      title = item?.title || ''
    } else if (itemType === 'resource') {
      const item = resources.find(r => r.id === itemId)
      title = item?.title || ''
    }

    if (title) {
      addRecentView({ id: itemId, type: itemType, title })
      setRecentViews(getRecentViews())
    }
  }

  const handleCreateNew = (type: 'sop' | 'prompt' | 'resource') => {
    setSelectedItemId(null)
    setSelectedItemType(type)
    setIsEditing(true)
    if (type === 'sop') setActiveView('all-sops')
    else if (type === 'prompt') setActiveView('all-prompts')
    else if (type === 'resource') setActiveView('all-resources')
    setUploadedSOPData(null)
  }

  const handleCloseViewer = () => {
    setSelectedItemId(null)
    setSelectedItemType(null)
    setUploadedSOPData(null)
    setSidebarPinned(true)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setUploadedSOPData(null)
  }

  const handleEditorClose = () => {
    setIsEditing(false)
    setUploadedSOPData(null)
    fetchAllData()
  }

  const handleUploadClick = () => {
    setUploadModalOpen(true)
  }

  const handleSOPUpload = (parsedData: {
    title: string
    objectives: string
    logins_prerequisites: string
    steps: SOPStep[]
  }) => {
    setUploadedSOPData(parsedData)
    setSelectedItemId(null)
    setSelectedItemType('sop')
    setIsEditing(true)
  }

  const handleDeleteSOP = async () => {
    if (!selectedItemId || selectedItemType !== 'sop') return

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('sops')
        .delete()
        .eq('id', selectedItemId)

      if (error) throw error

      setSelectedItemId(null)
      setSelectedItemType(null)
      await fetchAllData()
    } catch (err) {
      console.error('Error deleting SOP:', err)
      alert('Failed to delete SOP')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-[#878787]">Loading...</div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const selectedSOP = selectedItemType === 'sop' ? sops.find(s => s.id === selectedItemId) : null
  const selectedPrompt = selectedItemType === 'prompt' ? prompts.find(p => p.id === selectedItemId) : null
  const selectedResource = selectedItemType === 'resource' ? resources.find(r => r.id === selectedItemId) : null

  const renderContent = () => {
    if (activeApp === 'knowledge-base') {
      // If editing, show editor
      if (isEditing && selectedItemType === 'sop') {
        return (
          <SOPEditor
            sop={selectedSOP || null}
            tags={tags}
            onClose={handleEditorClose}
            uploadedData={uploadedSOPData}
          />
        )
      }

      if (isEditing && selectedItemType === 'prompt') {
        return (
          <PromptEditor
            prompt={selectedPrompt || null}
            tags={tags}
            onClose={handleEditorClose}
          />
        )
      }

      if (isEditing && selectedItemType === 'resource') {
        return (
          <ResourceEditor
            resource={selectedResource || null}
            tags={tags}
            onClose={handleEditorClose}
          />
        )
      }

      // If item selected, show viewer
      if (selectedSOP) {
        return (
          <div className="h-full">
            <SOPViewer
              sop={selectedSOP}
              onClose={handleCloseViewer}
              onEdit={profile.role === 'admin' ? handleEdit : undefined}
              onDelete={profile.role === 'admin' ? handleDeleteSOP : undefined}
              onImportOverride={profile.role === 'admin' ? (updates) => {
                setUploadedSOPData(updates)
                setIsEditing(true)
              } : undefined}
            />
          </div>
        )
      }

      if (selectedPrompt) {
        return (
          <div className="h-full">
            <PromptViewer
              prompt={selectedPrompt}
              onClose={handleCloseViewer}
              onEdit={profile.role === 'admin' ? handleEdit : undefined}
            />
          </div>
        )
      }

      if (selectedResource) {
        return (
          <div className="h-full">
            <ResourceViewer
              resource={selectedResource}
              onClose={handleCloseViewer}
              onEdit={profile.role === 'admin' ? handleEdit : undefined}
            />
          </div>
        )
      }

      // Default state - show Knowledge Base dashboard
      return (
        <div className="h-full overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-[#1a1a1a]">Knowledge Base</h1>
                <p className="text-[#878787] mt-1">SOPs, prompts, and resources for your team</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setActiveView('all-sops')
                  setSidebarPinned(true)
                  setSopsExpanded(true)
                }}
                className="bg-white rounded-xl border border-[#e3e3e3] p-4 text-left hover:border-[#673ae4] hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📚</span>
                  <span className="text-2xl font-bold text-[#1a1a1a]">{sops.length}</span>
                </div>
                <p className="text-sm font-medium text-[#1a1a1a] group-hover:text-[#673ae4]">SOPs</p>
                <p className="text-xs text-[#878787]">Standard procedures</p>
              </button>

              <button
                onClick={() => {
                  setActiveView('all-prompts')
                  setSidebarPinned(true)
                  setPromptsExpanded(true)
                }}
                className="bg-white rounded-xl border border-[#e3e3e3] p-4 text-left hover:border-[#673ae4] hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">💬</span>
                  <span className="text-2xl font-bold text-[#1a1a1a]">{prompts.length}</span>
                </div>
                <p className="text-sm font-medium text-[#1a1a1a] group-hover:text-[#673ae4]">Prompts</p>
                <p className="text-xs text-[#878787]">Reusable templates</p>
              </button>

              <button
                onClick={() => {
                  setActiveView('all-resources')
                  setSidebarPinned(true)
                  setResourcesExpanded(true)
                }}
                className="bg-white rounded-xl border border-[#e3e3e3] p-4 text-left hover:border-[#673ae4] hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📎</span>
                  <span className="text-2xl font-bold text-[#1a1a1a]">{resources.length}</span>
                </div>
                <p className="text-sm font-medium text-[#1a1a1a] group-hover:text-[#673ae4]">Resources</p>
                <p className="text-xs text-[#878787]">Files & documents</p>
              </button>
            </div>

            {/* Quick Actions (Admin only) */}
            {profile?.role === 'admin' && (
              <div className="bg-white rounded-xl border border-[#e3e3e3] p-4">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCreateNew('sop')}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#673ae4] bg-[#f3f4ff] hover:bg-[#e8e9ff] rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New SOP
                  </button>
                  <button
                    onClick={handleUploadClick}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#3b82f6] bg-[#eff6ff] hover:bg-[#dbeafe] rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload SOP
                  </button>
                  <button
                    onClick={() => handleCreateNew('prompt')}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#673ae4] bg-[#f3f4ff] hover:bg-[#e8e9ff] rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Prompt
                  </button>
                  <button
                    onClick={() => handleCreateNew('resource')}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#673ae4] bg-[#f3f4ff] hover:bg-[#e8e9ff] rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Resource
                  </button>
                </div>
              </div>
            )}

            {/* Recent Items */}
            {recentViews.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e3e3e3] p-4">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Recently Viewed</h3>
                <div className="space-y-1">
                  {recentViews.slice(0, 5).map((recent) => {
                    const icon = recent.type === 'sop' ? '📚' : recent.type === 'prompt' ? '💬' : '📎'
                    const typeLabel = recent.type === 'sop' ? 'SOP' : recent.type === 'prompt' ? 'Prompt' : 'Resource'
                    return (
                      <button
                        key={`${recent.type}-${recent.id}`}
                        onClick={() => handleItemSelect(recent.id, recent.type)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-[#fafafa] transition-colors group"
                      >
                        <span className="text-lg">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#1a1a1a] truncate group-hover:text-[#673ae4]">{recent.title}</p>
                          <p className="text-xs text-[#878787]">{typeLabel}</p>
                        </div>
                        <svg className="w-4 h-4 text-[#c4c4c4] group-hover:text-[#673ae4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty state if no content */}
            {sops.length === 0 && prompts.length === 0 && resources.length === 0 && (
              <div className="bg-white rounded-xl border border-[#e3e3e3] p-8 text-center">
                <div className="text-4xl mb-3">🚀</div>
                <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">Get Started</h3>
                <p className="text-[#878787] mb-4">Create your first SOP, prompt, or resource to build your knowledge base.</p>
              </div>
            )}
          </div>
        </div>
      )
    } else if (activeApp === 'reporting') {
      return (
        <div className="h-full">
          <ReportingDashboard />
        </div>
      )
    } else if (activeApp === 'copywriting') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#fff4f0] text-[#f06837] rounded-2xl mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">Copywriting Studio</h2>
            <p className="text-[#878787] mb-4">AI-powered copywriting tools for email campaigns, subject lines, and more.</p>
            <span className="inline-flex items-center px-3 py-1 bg-[#fafafa] border border-[#e3e3e3] text-[#878787] text-sm rounded-full">
              Coming Soon
            </span>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f5f5f7] flex flex-col">
      <Navigation
        activeApp={activeApp}
        onAppChange={setActiveApp}
        profile={profile}
        user={user}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeApp={activeApp}
          activeView={activeView}
          selectedItemId={selectedItemId}
          onViewChange={setActiveView}
          onItemSelect={handleItemSelect}
          onCreateNew={handleCreateNew}
          onUploadSop={handleUploadClick}
          tags={tags}
          sops={sops}
          prompts={prompts}
          resources={resources}
          recentViews={recentViews}
          isAdmin={profile?.role === 'admin'}
          isPinned={sidebarPinned}
          onPinnedChange={setSidebarPinned}
          isSOPsExpanded={sopsExpanded}
          onSOPsExpandedChange={setSopsExpanded}
          isPromptsExpanded={promptsExpanded}
          onPromptsExpandedChange={setPromptsExpanded}
          isResourcesExpanded={resourcesExpanded}
          onResourcesExpandedChange={setResourcesExpanded}
        />
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleSOPUpload}
      />
    </div>
  )
}
