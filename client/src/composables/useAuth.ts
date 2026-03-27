import { supabase } from '../lib/supabase'

let cachedToken: string | undefined

function getTokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000
  } catch { return 0 }
}

export async function getToken(): Promise<string | undefined> {
  if (cachedToken && Date.now() < getTokenExpiry(cachedToken) - 60_000) {
    return cachedToken
  }
  cachedToken = undefined
  const { data: { session } } = await supabase.auth.getSession()
  cachedToken = session?.access_token
  return cachedToken
}

export function clearTokenCache() {
  cachedToken = undefined
}
