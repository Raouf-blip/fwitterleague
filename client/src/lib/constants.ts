export const LOL_RANKS = [
  'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM',
  'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'
] as const

export const LOL_DIVISIONS = ['IV', 'III', 'II', 'I'] as const

export const RANK_COLORS: Record<string, string> = {
  IRON: '#6b6b6b',
  BRONZE: '#a0714f',
  SILVER: '#8c9298',
  GOLD: '#c8aa6e',
  PLATINUM: '#4da09b',
  EMERALD: '#2ea060',
  DIAMOND: '#576cce',
  MASTER: '#9d48e0',
  GRANDMASTER: '#e74c3c',
  CHALLENGER: '#f4c874',
}

export const LOL_ROLES = [
  { key: 'Top', label: 'Top', icon: 'Shield' },
  { key: 'Jungle', label: 'Jungle', icon: 'Swords' },
  { key: 'Mid', label: 'Mid', icon: 'Sparkles' },
  { key: 'ADC', label: 'ADC', icon: 'Target' },
  { key: 'Support', label: 'Support', icon: 'Heart' },
] as const

export const STATUS_MAP = {
  pending: { label: 'En attente', color: 'warning' },
  accepted: { label: 'Accepté', color: 'success' },
  rejected: { label: 'Refusé', color: 'danger' },
} as const

export const TOURNAMENT_STATUS_MAP = {
  upcoming: { label: 'Inscriptions ouvertes', color: 'cyan' },
  ongoing: { label: 'En cours', color: 'gold' },
  finished: { label: 'Terminé', color: 'muted' },
} as const
