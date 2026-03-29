export interface Profile {
  id: string
  username: string
  riot_id: string | null
  opgg_url: string | null
  avatar_url: string | null
  discord: string | null
  discord_id: string | null
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
  scrim_stats?: {
    games_played: number
    wins: number
    losses: number
    kda: string
    avg_cs: string
  } | null
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

export type ScrimType = "team" | "open"
export type ScrimStatus = "pending" | "scheduled" | "completed" | "cancelled"
export type ScrimSide = "blue" | "red" | "reserve"

export interface Scrim {
  id: string
  type: ScrimType
  status: ScrimStatus
  scheduled_at: string
  creator_id: string
  creator?: { username: string; id: string }
  challenger_team_id?: string
  challenger_team?: TeamSummary & { captain_id?: string }
  challenged_team_id?: string
  challenged_team?: TeamSummary & { captain_id?: string }
  screenshot_url?: string
  game_duration?: number
  participants?: ScrimParticipant[]
  stats?: ScrimStats[]
  created_at: string
  winner_id?: string
  is_validated?: boolean
}

export interface ScrimParticipant {
  id: string
  scrim_id: string
  user_id: string
  side?: ScrimSide
  joined_at: string
  profile?: Profile
}

export interface ScrimStats {
  id: string
  scrim_id: string
  user_id: string;
  champion_name: string
  kills: number
  deaths: number
  assists: number
  cs: number
  win: boolean
  profile?: { username: string }
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
  role: "Captain" | "Member"
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
  status: "upcoming" | "ongoing" | "finished"
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

export interface AppNotification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  metadata?: Record<string, any>
  created_at: string
}

export interface Application {
  id: string
  team_id: string
  sender_id: string
  message: string | null
  status: 'pending' | 'accepted' | 'rejected'
  type: 'application' | 'offer'
  created_at: string
  team?: { name: string; tag: string }
  sender?: { id: string; username: string; rank: string | null }
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
  created_at: string;
  team_1: { name: string }
  team_2: { name: string }
}
