import { supabase } from '../lib/supabase'

let cachedToken: string | undefined
let cacheExpiry = 0

export async function getToken(): Promise<string | undefined> {
  const now = Date.now()
  if (cachedToken && now < cacheExpiry) {
    return cachedToken
  }
  const { data: { session } } = await supabase.auth.getSession()
  cachedToken = session?.access_token
  // Cache for 5 minutes (tokens last much longer)
  cacheExpiry = now + 5 * 60 * 1000
  return cachedToken
}

export function clearTokenCache() {
  cachedToken = undefined
  cacheExpiry = 0
}
