export type UserStatus = 'pending' | 'approved' | 'banned'
export type UserRole = 'user' | 'admin'

export interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  status: UserStatus
  role: UserRole
  created_at: string | null
  approved_at: string | null
  banned_at: string | null
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: {
          id?: string
          email?: string | null
          full_name?: string | null
          status?: UserStatus
          role?: UserRole
          created_at?: string | null
          approved_at?: string | null
          banned_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          status?: UserStatus
          role?: UserRole
          created_at?: string | null
          approved_at?: string | null
          banned_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
