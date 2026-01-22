'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/types/database'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('User fetched:', user, userError)
        setUser(user)

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          console.log('Profile fetched:', profile, profileError)

          // If profile doesn't exist, create it
          if (profileError && profileError.code === 'PGRST116') {
            console.log('Profile not found, creating...')
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email!,
                is_admin: false,
                role: 'viewer'
              })
              .select()
              .single()

            console.log('New profile created:', newProfile, insertError)
            setProfile(newProfile)
          } else {
            setProfile(profile)
          }
        }
      } catch (err) {
        console.error('Error in fetchUser:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.email)
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          console.log('Profile on auth change:', profile, error)

          // If profile doesn't exist, create it
          if (error && error.code === 'PGRST116') {
            console.log('Profile not found on auth change, creating...')
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                email: session.user.email!,
                is_admin: false,
                role: 'viewer'
              })
              .select()
              .single()

            setProfile(newProfile)
          } else {
            setProfile(profile)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, profile, loading, isAdmin: profile?.role === 'admin' }
}
