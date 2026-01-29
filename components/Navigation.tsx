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
                    <button
                      onClick={() => router.push('/settings')}
                      className="p-2 text-[#878787] hover:text-[#673ae4] hover:bg-[#f3f4ff] rounded-xl transition-all"
                      title="Settings"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
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
