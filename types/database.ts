export type TripStatus = 'collecting' | 'ready' | 'booked'
export type MemberRole = 'organiser' | 'attendee'
export type MemberStatus = 'pending' | 'accepted' | 'declined'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          name: string
          description: string | null
          organiser_id: string
          group_size: number
          start_date: string
          end_date: string
          trip_type: string
          payment_method: string
          status: TripStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          organiser_id: string
          group_size: number
          start_date: string
          end_date: string
          trip_type: string
          payment_method: string
          status?: TripStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          organiser_id?: string
          group_size?: number
          start_date?: string
          end_date?: string
          trip_type?: string
          payment_method?: string
          status?: TripStatus
          created_at?: string
          updated_at?: string
        }
      }
      trip_members: {
        Row: {
          id: string
          trip_id: string
          user_id: string | null
          invite_email: string | null
          role: MemberRole
          status: MemberStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id?: string | null
          invite_email?: string | null
          role: MemberRole
          status?: MemberStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string | null
          invite_email?: string | null
          role?: MemberRole
          status?: MemberStatus
          created_at?: string
          updated_at?: string
        }
      }
      member_preferences: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          preferred_airport: string | null
          budget_min: number | null
          budget_max: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          preferred_airport?: string | null
          budget_min?: number | null
          budget_max?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          preferred_airport?: string | null
          budget_min?: number | null
          budget_max?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      trip_options: {
        Row: {
          id: string
          trip_id: string
          category: string
          title: string
          description: string | null
          estimated_cost: number | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          category: string
          title: string
          description?: string | null
          estimated_cost?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          category?: string
          title?: string
          description?: string | null
          estimated_cost?: number | null
          created_at?: string
        }
      }
    }
  }
}
