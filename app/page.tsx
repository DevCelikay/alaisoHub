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
import { Tag, SOPWithTags, PromptWithTags, SOPStep } from '@/lib/types/database'
import { parseSOPFile, readFileAsText } from '@/lib/utils/sopParser'

type App = 'reporting' | 'knowledge-base' | 'copywriting'
type View = 'all-sops' | 'all-prompts'

export default function Home() {
  const [activeApp, setActiveApp] = useState<App>('knowledge-base')
  const [activeView, setActiveView] = useState<View>('all-sops')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedItemType, setSelectedItemType] = useState<'sop' | 'prompt' | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tags, setTags] = useState<Tag[]>([])
  const [sops, setSops] = useState<SOPWithTags[]>([])
  const [prompts, setPrompts] = useState<PromptWithTags[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [uploadedSOPData, setUploadedSOPData] = useState<{
    title: string
    objectives: string
    logins_prerequisites: string
    steps: SOPStep[]
  } | null>(null)
  const router = useRouter()
  const uploadInputRef = useRef<HTMLInputElement>(null)

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
  }

  const handleItemSelect = (itemId: string, itemType: 'sop' | 'prompt') => {
    setSelectedItemId(itemId)
    setSelectedItemType(itemType)
    setIsEditing(false)
    setUploadedSOPData(null)
  }

  const handleCreateNew = (type: 'sop' | 'prompt') => {
    setSelectedItemId(null)
    setSelectedItemType(type)
    setIsEditing(true)
    setActiveView(type === 'sop' ? 'all-sops' : 'all-prompts')
    setUploadedSOPData(null)
  }

  const handleCloseViewer = () => {
    setSelectedItemId(null)
    setSelectedItemType(null)
    setUploadedSOPData(null)
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
    uploadInputRef.current?.click()
  }

  const handleUploadSop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await readFileAsText(file)
      const parsedData = parseSOPFile(text, file.name)
      setUploadedSOPData(parsedData)
      setSelectedItemId(null)
      setSelectedItemType('sop')
      setIsEditing(true)
    } catch (error) {
      console.error('Error parsing file:', error)
      alert('Failed to parse SOP file. Please check the format.')
    } finally {
      e.target.value = ''
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

      // If item selected, show viewer
      if (selectedSOP) {
        return (
          <div className="h-full">
            <SOPViewer
              sop={selectedSOP}
              onClose={handleCloseViewer}
              onEdit={profile.role === 'admin' ? handleEdit : undefined}
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

      // Default state - nothing selected
      return (
        <div className="flex items-center justify-center h-full p-3">
          <div className="text-center bg-white rounded-2xl shadow-lg border border-[#e3e3e3] p-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">Knowledge Base</h2>
            <p className="text-[#878787]">Select an item from the sidebar to view</p>
          </div>
        </div>
      )
    } else if (activeApp === 'reporting') {
      return (
        <div className="flex-1 flex items-center justify-center p-3">
          <div className="text-center bg-white rounded-2xl shadow-lg border border-[#e3e3e3] p-12">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">Reporting</h2>
            <p className="text-[#878787]">Coming soon...</p>
          </div>
        </div>
      )
    } else if (activeApp === 'copywriting') {
      return (
        <div className="flex-1 flex items-center justify-center p-3">
          <div className="text-center bg-white rounded-2xl shadow-lg border border-[#e3e3e3] p-12">
            <div className="text-6xl mb-4">✍️</div>
            <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">Copywriting</h2>
            <p className="text-[#878787]">Coming soon...</p>
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
        <input
          ref={uploadInputRef}
          type="file"
          accept=".txt,.md"
          onChange={handleUploadSop}
          className="hidden"
        />
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
          isAdmin={profile?.role === 'admin'}
        />
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
