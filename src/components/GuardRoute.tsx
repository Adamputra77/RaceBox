import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/useAuth'
import { AuthLoading } from '@/app/auth/AuthLoading'

export function GuardRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'loading') return <AuthLoading />

  if (status === 'unconfigured') return <>{children}</>

  if (status === 'signedOut') return <Navigate to="/login" replace />

  if (status === 'banned') return <Navigate to="/banned" replace />

  if (status === 'pending') return <Navigate to="/pending" replace />

  return <>{children}</>
}
