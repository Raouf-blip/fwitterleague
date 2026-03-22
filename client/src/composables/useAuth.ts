import { supabase } from '../lib/supabase'

export async function getToken(): Promise<string | undefined> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}
