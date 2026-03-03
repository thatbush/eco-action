export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'user' | 'org' | 'admin'
          display_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'user' | 'org' | 'admin'
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'user' | 'org' | 'admin'
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tier_id: number
          current_points: number
          lifetime_points: number
          current_streak: number
          longest_streak: number
          last_task_date: string | null
        }
        Insert: {
          id: string
          tier_id?: number
          current_points?: number
          lifetime_points?: number
          current_streak?: number
          longest_streak?: number
          last_task_date?: string | null
        }
        Update: {
          id?: string
          tier_id?: number
          current_points?: number
          lifetime_points?: number
          current_streak?: number
          longest_streak?: number
          last_task_date?: string | null
        }
      }
      organizations: {
        Row: {
          id: string
          profile_id: string
          org_name: string
          description: string | null
          verification_status: 'pending' | 'verified' | 'rejected'
          kra_pin: string
          contact_email: string
          points_balance: number
          escrow_balance: number
          lifetime_points_purchased: number
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          org_name: string
          description?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          kra_pin: string
          contact_email: string
          points_balance?: number
          escrow_balance?: number
          lifetime_points_purchased?: number
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          org_name?: string
          description?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          kra_pin?: string
          contact_email?: string
          points_balance?: number
          escrow_balance?: number
          lifetime_points_purchased?: number
          created_at?: string
        }
      }
    }
    Enums: {
      user_role: 'user' | 'org' | 'admin'
      verification_status: 'pending' | 'verified' | 'rejected'
    }
  }
}