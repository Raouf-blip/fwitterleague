import { Events, Client } from 'discord.js';
import { SyncService } from '../services/sync.service';
import { supabase } from '../config/supabase';
import { notifyNewScrim } from '../utils/scrim-notifier';
import { notifyNewPatchNote } from '../utils/patchnote-notifier';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client) {
        console.log(`Ready! Logged in as ${client.user?.tag}`);

        // Initial Sync
        try {
            await SyncService.fullSync(client);
        } catch (error) {
            console.error('[Sync] Error during initial sync:', error);
        }

        // Realtime Subscription
        supabase
            .channel('db-changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scrims' }, (payload) => {
                notifyNewScrim(client, payload.new);
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'patch_notes' }, (payload) => {
                notifyNewPatchNote(client, payload.new);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
                SyncService.syncUserRoles(client, payload.new);
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'teams' }, (payload) => {
                SyncService.syncTeam(client, payload.new);
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_members' }, (payload) => {
                SyncService.syncTeamMember(client, payload.new.team_id, payload.new.profile_id, 'INSERT');
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'team_members' }, (payload) => {
                SyncService.syncTeamMember(client, payload.old.team_id, payload.old.profile_id, 'DELETE');
            })
            .subscribe();

        console.log('[Realtime] Listening for database events...');
    },
};
