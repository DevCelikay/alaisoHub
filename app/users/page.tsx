'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, Invitation, UserRole } from '@/lib/types/database'
import { Users, Mail, Shield, Eye, Copy, Check, Trash2, ArrowLeft, Plus, X } from 'lucide-react'

export default function UsersPage() {
  const router = useRouter()
  const supabase = createClient()

  const [users, setUsers] = useState<Profile[]>([])
  const [invitations, setInvitations] = useState<(Invitation & { inviter?: { email: string; full_name: string | null } | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      router.push('/')
      return
    }

    setCurrentUser(profile)
    await Promise.all([loadUsers(), loadInvitations()])
    setLoading(false)
  }

  const loadUsers = async () => {
    const response = await fetch('/api/users')
    if (response.ok) {
      const data = await response.json()
      setUsers(data)
    }
  }

  const loadInvitations = async () => {
    const response = await fetch('/api/invitations')
    if (response.ok) {
      const data = await response.json()
      setInvitations(data)
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const response = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole })
    })

    if (response.ok) {
      setUsers(users.map(u =>
        u.id === userId ? { ...u, role: newRole, is_admin: newRole === 'admin' } : u
      ))
    } else {
      const error = await response.json()
      alert(error.error)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError('')
    setInviteLink('')

    const response = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole })
    })

    const data = await response.json()

    if (response.ok) {
      setInviteLink(data.invitationLink)
      await loadInvitations()
    } else {
      setInviteError(data.error)
    }

    setInviteLoading(false)
  }

  const handleDeleteInvitation = async (id: string) => {
    const response = await fetch(`/api/invitations?id=${id}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      setInvitations(invitations.filter(i => i.id !== id))
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const resetInviteModal = () => {
    setShowInviteModal(false)
    setInviteEmail('')
    setInviteRole('viewer')
    setInviteError('')
    setInviteLink('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#673ae4]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="p-3 pb-0">
        <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3]">
          <div className="px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/')}
                  className="p-2 text-[#878787] hover:text-[#673ae4] hover:bg-[#f3f4ff] rounded-xl transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-semibold text-[#1a1a1a]">User Management</h1>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#673ae4] text-white rounded-xl hover:bg-[#5a32c7] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Invite User</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Users Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3] mb-6">
          <div className="px-6 py-4 border-b border-[#e3e3e3]">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#673ae4]" />
              <h2 className="text-lg font-semibold text-[#1a1a1a]">Users ({users.length})</h2>
            </div>
          </div>
          <div className="divide-y divide-[#e3e3e3]">
            {users.map(user => (
              <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#f3f4ff] rounded-full flex items-center justify-center">
                    <span className="text-[#673ae4] font-medium">
                      {(user.full_name || user.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-[#1a1a1a] font-medium">
                      {user.full_name || 'No name'}
                      {user.id === currentUser?.id && (
                        <span className="ml-2 text-xs text-[#878787]">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-[#878787]">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    disabled={user.id === currentUser?.id}
                    className={`px-3 py-2 rounded-xl border border-[#e3e3e3] text-sm focus:outline-none focus:border-[#673ae4] ${
                      user.id === currentUser?.id ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`}
                  >
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <div className="flex items-center space-x-1">
                    {user.role === 'admin' ? (
                      <Shield className="w-4 h-4 text-[#673ae4]" />
                    ) : (
                      <Eye className="w-4 h-4 text-[#878787]" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invitations Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3]">
          <div className="px-6 py-4 border-b border-[#e3e3e3]">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-[#673ae4]" />
              <h2 className="text-lg font-semibold text-[#1a1a1a]">
                Pending Invitations ({invitations.filter(i => !i.accepted_at).length})
              </h2>
            </div>
          </div>
          <div className="divide-y divide-[#e3e3e3]">
            {invitations.filter(i => !i.accepted_at).length === 0 ? (
              <div className="px-6 py-8 text-center text-[#878787]">
                No pending invitations
              </div>
            ) : (
              invitations
                .filter(i => !i.accepted_at)
                .map(invitation => {
                  const isExpired = new Date(invitation.expires_at) < new Date()
                  return (
                    <div key={invitation.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isExpired ? 'bg-red-50' : 'bg-[#f3f4ff]'
                        }`}>
                          <Mail className={`w-5 h-5 ${isExpired ? 'text-red-400' : 'text-[#673ae4]'}`} />
                        </div>
                        <div>
                          <p className="text-[#1a1a1a] font-medium">{invitation.email}</p>
                          <p className="text-sm text-[#878787]">
                            Invited by {invitation.inviter?.email || 'Unknown'} •{' '}
                            {isExpired ? (
                              <span className="text-red-500">Expired</span>
                            ) : (
                              `Expires ${new Date(invitation.expires_at).toLocaleDateString()}`
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invitation.role === 'admin'
                            ? 'bg-[#f3f4ff] text-[#673ae4]'
                            : 'bg-gray-100 text-[#878787]'
                        }`}>
                          {invitation.role}
                        </span>
                        <button
                          onClick={() => handleDeleteInvitation(invitation.id)}
                          className="p-2 text-[#878787] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-[#e3e3e3] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#1a1a1a]">Invite User</h3>
              <button
                onClick={resetInviteModal}
                className="p-2 text-[#878787] hover:text-[#1a1a1a] hover:bg-[#fafafa] rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {!inviteLink ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#e3e3e3] focus:outline-none focus:border-[#673ae4] text-[#1a1a1a]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as UserRole)}
                      className="w-full px-4 py-3 rounded-xl border border-[#e3e3e3] focus:outline-none focus:border-[#673ae4] text-[#1a1a1a]"
                    >
                      <option value="viewer">Viewer - Can view SOPs and Prompts</option>
                      <option value="admin">Admin - Full access including user management</option>
                    </select>
                  </div>
                  {inviteError && (
                    <p className="text-red-500 text-sm">{inviteError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="w-full py-3 bg-[#673ae4] text-white rounded-xl hover:bg-[#5a32c7] transition-all disabled:opacity-50"
                  >
                    {inviteLoading ? 'Sending...' : 'Generate Invitation Link'}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-green-800 text-sm font-medium mb-2">
                      Invitation created successfully!
                    </p>
                    <p className="text-green-700 text-sm">
                      Share this link with {inviteEmail}. It expires in 7 days.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-xl border border-[#e3e3e3] bg-[#fafafa] text-sm text-[#1a1a1a]"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inviteLink, 'invite')}
                      className="p-3 bg-[#673ae4] text-white rounded-xl hover:bg-[#5a32c7] transition-all"
                    >
                      {copiedId === 'invite' ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={resetInviteModal}
                    className="w-full py-3 border border-[#e3e3e3] text-[#1a1a1a] rounded-xl hover:bg-[#fafafa] transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
