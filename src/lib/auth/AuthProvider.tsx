import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import type { ProfileRow } from './databaseTypes'
import { AuthContext, type AuthStatus } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      setProfile(null)
      return
    }
    setProfile(data)
  }, [])

  useEffect(() => {
    if (!session?.user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(null)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false)
    void fetchProfile(session.user.id)
  }, [session, fetchProfile])

  // Jika profil belum ketemu (mis. user dibuat manual / trigger belum jalan),
  // coba ambil ulang beberapa kali supaya admin yang baru diset bisa langsung login.
  useEffect(() => {
    if (!session?.user || profile) return
    const id = setInterval(() => {
      void fetchProfile(session.user.id)
    }, 2000)
    return () => clearInterval(id)
  }, [session, profile, fetchProfile])

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      return { error: error?.message ?? null }
    },
    [],
  )

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return
    await fetchProfile(session.user.id)
  }, [session, fetchProfile])

  let status: AuthStatus = 'loading'
  if (!isSupabaseConfigured) status = 'unconfigured'
  else if (loading) status = 'loading'
  else if (!session?.user) status = 'signedOut'
  else if (profile?.status === 'banned') status = 'banned'
  else if (profile?.status === 'approved') status = 'approved'
  else if (profile?.status === 'pending') status = 'pending'
  // Ada session tapi profil tidak ditemukan (mis. user dibuat manual).
  // Fallback ke pending agar tidak terjebak di "loading" selamanya.
  else if (session?.user) status = 'pending'

  const isAdmin = profile?.role === 'admin' && profile?.status === 'approved'

  return (
    <AuthContext.Provider
      value={{
        status,
        user: session?.user ?? null,
        profile,
        isAdmin,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
