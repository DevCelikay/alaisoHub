'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import UsersTab from '@/components/settings/UsersTab'
import TagsTab from '@/components/settings/TagsTab'
import ApiKeysTab from '@/components/settings/ApiKeysTab'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('users')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin && profile?.role !== 'admin') {
      router.push('/')
      return
    }

    setIsAdmin(true)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#673ae4]"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="p-3 pb-0">
        <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3]">
          <div className="px-6">
            <div className="flex items-center space-x-4 h-16">
              <button
                onClick={() => router.push('/')}
                className="p-2 text-[#878787] hover:text-[#673ae4] hover:bg-[#f3f4ff] rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-[#1a1a1a]">Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-6 max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-white border border-[#e3e3e3] p-1">
            <TabsTrigger value="users" className="data-[state=active]:bg-[#673ae4] data-[state=active]:text-white">
              Users
            </TabsTrigger>
            <TabsTrigger value="tags" className="data-[state=active]:bg-[#673ae4] data-[state=active]:text-white">
              Tags
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="data-[state=active]:bg-[#673ae4] data-[state=active]:text-white">
              API Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="tags">
            <TagsTab />
          </TabsContent>

          <TabsContent value="api-keys">
            <ApiKeysTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
