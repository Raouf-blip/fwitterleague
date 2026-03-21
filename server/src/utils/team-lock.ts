import { supabase } from '../config/supabase';

/**
 * Check if team is locked due to active tournament
 */
export async function checkTeamLock(teamId: string) {
  const { data: registrations } = await supabase
    .from('tournament_registrations')
    .select('tournament_id, tournaments!inner(status)')
    .eq('team_id', teamId)
    .eq('tournaments.status', 'ongoing');

  return registrations && registrations.length > 0;
}
