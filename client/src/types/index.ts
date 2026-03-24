export interface Profile {
  id: string
  username: string
  riot_id: string | null
  opgg_url: string | null
  avatar_url: string | null
  discord: string | null
  role: 'user' | 'admin' | 'superadmin'
  preferred_roles?: string[]
  is_captain: boolean
  is_looking_for_team: boolean
  is_caster?: boolean
  bio: string | null
  rank: string | null
  winrate: number
  lp?: number
  last_riot_sync: string | null
  created_at: string
  team: TeamSummary | null
}

export interface TeamSummary {
  id: string
  name: string
  tag: string
  logo_url?: string | null
  member_count?: number
  total_lp?: number
  average_rank?: string
}

export interface Team {
  id: string
  name: string
  tag: string
  logo_url: string | null
  description: string | null
  captain_id: string
  is_locked: boolean
  total_lp?: number
  average_rank?: string
  created_at: string
  members: TeamMember[]
}

export interface TeamMember {
  id: string
  team_id: string
  profile_id: string
  role: 'Captain' | 'Member'
  joined_at: string
  profile: {
    id: string
    username: string
    avatar_url: string | null
    riot_id: string | null
    rank: string | null
    winrate: number
    lp?: number
    preferred_roles?: string[]
  }
}

export interface Tournament {
  id: string
  name: string
  description: string | null
  max_teams: number
  status: 'upcoming' | 'ongoing' | 'finished'
  start_date: string
  end_date: string
  created_at: string
  registrations?: TournamentRegistration[] | Array<{ count: number }>
}

export interface TournamentRegistration {
  id: string
  tournament_id: string
  team_id: string
  registered_at: string
  team: Team
}

export interface Match {
  id: string
  tournament_id: string
  team_1_id: string
  team_2_id: string
  score_1: number | null
  score_2: number | null
  scheduled_at: string
  winner_id: string | null
  created_at: string
  team_1: { name: string }
  team_2: { name: string }
}

export interface Application {
  id: string
  team_id: string
  sender_id: string
  message: string | null
  status: 'pending' | 'accepted' | 'rejected'
  type: 'application' | 'offer'
  created_at: string
  team?: TeamSummary & { captain_id?: string }
  sender?: { username: string; rank: string | null; id: string }
}

export interface AppNotification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'application' | 'offer' | 'system'
  is_read: boolean
  created_at: string
  isNotif?: boolean
}

export interface InboxResponse {
  notifications: AppNotification[]
  interactions: Application[]
}

export type Agent = Profile
