import { RANK_COLORS } from './constants'

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "A l'instant"
  if (minutes < 60) return `Il y a ${minutes}min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days < 7) return `Il y a ${days}j`
  return formatDate(dateStr)
}

export function getRankTier(rank: string | null): string {
  if (!rank) return 'UNRANKED'
  return rank.split(' ')[0].toUpperCase()
}

export function getRankColor(rank: string | null): string {
  const tier = getRankTier(rank)
  return RANK_COLORS[tier] || '#5b5a56'
}

export function getOpggUrl(riotId: string): string {
  const [name, tag] = riotId.split('#')
  return `https://www.op.gg/summoners/euw/${encodeURIComponent(name)}-${encodeURIComponent(tag || '')}`
}

export function getInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}

export function getRegistrationCount(registrations: any): number {
  if (!registrations) return 0
  if (Array.isArray(registrations) && registrations.length > 0) {
    if ('count' in registrations[0]) return registrations[0].count
    return registrations.length
  }
  return 0
}
