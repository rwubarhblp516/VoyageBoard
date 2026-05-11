export interface Trip {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  currency: string | null
  owner_id: string
  cover_url?: string | null
  created_at: string | null
}

export interface TripMember {
  id: string
  trip_id: string
  user_id: string | null
  display_name: string
  role: string | null
  joined_at: string | null
  avatar_url: string | null
}
