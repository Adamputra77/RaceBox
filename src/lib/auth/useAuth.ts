import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { ProfileRow } from './databaseTypes'

export type AuthStatus =
  | 'loading'
  | 'unconfigured'
  | 'signedOut'
  | 'pending'
  | 'approved'
  | 'banned'

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  profile: ProfileRow | null
  profileError: string | null
  profileDebug: Record<string, unknown> | null
  isAdmin: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export type { UserStatus } from './databaseTypes'
