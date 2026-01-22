'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Shield, Eye, AlertCircle, CheckCircle } from 'lucide-react'

interface InvitationData {
  id: string
  email: string
  role: string
  expires_at: string
  inviter?: {
    email: string
    full_name: string | null
  } | null
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    verifyInvitation()
  }, [resolvedParams.token])

  const verifyInvitation = async () => {
    const response = await fetch(`/api/invitations/verify?token=${resolvedParams.token}`)
    const data = await response.json()

    if (response.ok) {
      setInvitation(data)
    } else {
      setError(data.error)
    }
    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError('')

    if (password !== confirmPassword) {
      setSignupError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setSignupError('Password must be at least 6 characters')
      return
    }

    setSignupLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: invitation!.email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })

    if (error) {
      setSignupError(error.message)
      setSignupLoading(false)
      return
    }

    if (data.user) {
      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#673ae4]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3] p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-[#1a1a1a] mb-2">Invalid Invitation</h1>
          <p className="text-[#878787] mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-[#673ae4] text-white rounded-xl hover:bg-[#5a32c7] transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3] p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-semibold text-[#1a1a1a] mb-2">Account Created!</h1>
          <p className="text-[#878787]">Redirecting you to the dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3] p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#f3f4ff] rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-[#673ae4]" />
          </div>
          <h1 className="text-xl font-semibold text-[#1a1a1a] mb-2">You're Invited!</h1>
          <p className="text-[#878787]">
            {invitation?.inviter?.full_name || invitation?.inviter?.email || 'Someone'} has invited you to join Alaiso Hub.
          </p>
        </div>

        <div className="bg-[#fafafa] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#878787]">Email</p>
              <p className="text-[#1a1a1a] font-medium">{invitation?.email}</p>
            </div>
            <div className="flex items-center space-x-2">
              {invitation?.role === 'admin' ? (
                <Shield className="w-5 h-5 text-[#673ae4]" />
              ) : (
                <Eye className="w-5 h-5 text-[#878787]" />
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                invitation?.role === 'admin'
                  ? 'bg-[#f3f4ff] text-[#673ae4]'
                  : 'bg-gray-100 text-[#878787]'
              }`}>
                {invitation?.role}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#e3e3e3] focus:outline-none focus:border-[#673ae4] text-[#1a1a1a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-[#e3e3e3] focus:outline-none focus:border-[#673ae4] text-[#1a1a1a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#e3e3e3] focus:outline-none focus:border-[#673ae4] text-[#1a1a1a]"
            />
          </div>

          {signupError && (
            <p className="text-red-500 text-sm">{signupError}</p>
          )}

          <button
            type="submit"
            disabled={signupLoading}
            className="w-full py-3 bg-[#673ae4] text-white rounded-xl hover:bg-[#5a32c7] transition-all disabled:opacity-50"
          >
            {signupLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#878787] mt-6">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-[#673ae4] hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
