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
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          // If profile doesn't exist, create it
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
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          // If profile doesn't exist, create it
          if (error && error.code === 'PGRST116') {
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
