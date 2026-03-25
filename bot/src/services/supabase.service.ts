import { supabase } from '../config/supabase';

export class SupabaseService {
    static async getProfileByDiscordId(discordId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('discord_id', discordId)
            .maybeSingle();
        return { data, error };
    }

    static async getProfileByUsername(username: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', username)
            .maybeSingle();
        return { data, error };
    }

    static async getTeamByName(name: string) {
        const { data, error } = await supabase
            .from('teams')
            .select('*, profiles!teams_captain_id_fkey(username)')
            .ilike('name', name)
            .maybeSingle();
        return { data, error };
    }

    static async getTeamMembers(teamId: string) {
        const { data, error } = await supabase
            .from('team_members')
            .select('*, profiles(username, rank)')
            .eq('team_id', teamId);
        return { data, error };
    }

    static async getTeamMembership(profileId: string) {
        const { data, error } = await supabase
            .from('team_members')
            .select('id')
            .eq('profile_id', profileId)
            .maybeSingle();
        return { data, error };
    }
}
