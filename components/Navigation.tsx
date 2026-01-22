'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types/database'

type App = 'reporting' | 'knowledge-base' | 'copywriting'

interface NavigationProps {
  activeApp: App
  onAppChange: (app: App) => void
  profile: Profile | null
  user: any
}

export default function Navigation({
  activeApp,
  onAppChange,
  profile,
  user
}: NavigationProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="sticky top-0 z-50 p-3 pb-0">
      {/* Top Level Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3]">
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Apps */}
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-[#1a1a1a]">Alaiso Hub</h1>

              <div className="flex space-x-2">
                <button
                  onClick={() => onAppChange('reporting')}
                  className={`px-5 py-2 text-sm font-medium rounded-xl transition-all ${
                    activeApp === 'reporting'
                      ? 'bg-[#f3f4ff] text-[#673ae4] shadow-sm'
                      : 'text-[#878787] hover:text-[#1a1a1a] hover:bg-[#fafafa]'
                  }`}
                >
                  Reporting
                </button>
                <button
                  onClick={() => onAppChange('knowledge-base')}
                  className={`px-5 py-2 text-sm font-medium rounded-xl transition-all ${
                    activeApp === 'knowledge-base'
                      ? 'bg-[#f3f4ff] text-[#673ae4] shadow-sm'
                      : 'text-[#878787] hover:text-[#1a1a1a] hover:bg-[#fafafa]'
                  }`}
                >
                  Knowledge Base
                </button>
                <button
                  onClick={() => onAppChange('copywriting')}
                  className={`px-5 py-2 text-sm font-medium rounded-xl transition-all ${
                    activeApp === 'copywriting'
                      ? 'bg-[#f3f4ff] text-[#673ae4] shadow-sm'
                      : 'text-[#878787] hover:text-[#1a1a1a] hover:bg-[#fafafa]'
                  }`}
                >
                  Copywriting
                </button>
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {profile && (
                <div className="flex items-center space-x-4">
                  {profile.role === 'admin' && (
                    <>
                      <button
                        onClick={() => router.push('/users')}
                        className="p-2 text-[#878787] hover:text-[#673ae4] hover:bg-[#f3f4ff] rounded-xl transition-all"
                        title="Manage Users"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => router.push('/tags')}
                        className="p-2 text-[#878787] hover:text-[#673ae4] hover:bg-[#f3f4ff] rounded-xl transition-all"
                        title="Manage Tags"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </button>
                    </>
                  )}
                  <div className="text-right">
                    <p className="text-sm text-[#1a1a1a]">{profile.email}</p>
                    {profile.role === 'admin' && (
                      <p className="text-xs text-[#878787]">Admin</p>
                    )}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm text-[#878787] hover:text-[#1a1a1a] hover:bg-[#fafafa] rounded-xl transition-all"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
