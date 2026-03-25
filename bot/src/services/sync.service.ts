import { Client, Guild, Role, ChannelType, PermissionsBitField, OverwriteResolvable, GuildMember, TextChannel } from 'discord.js';
import { supabase } from '../config/supabase';
import { SupabaseService } from './supabase.service';

const GUILD_ID = process.env.GUILD_ID;
const TEAM_CATEGORY_ID = process.env.TEAM_CATEGORY_ID; 
const CASTER_ROLE_NAME = 'Casteur';
const FREE_AGENT_ROLE_NAME = 'Agent Libre';

export class SyncService {
    static async syncUserRoles(client: Client, profile: any, inTeam?: boolean) {
        if (!profile.discord_id) return;
        const guild = await client.guilds.fetch(GUILD_ID!);
        try {
            const member = await guild.members.fetch(profile.discord_id);
            if (!member) return;

            // Caster Role
            await this.handleSimpleRole(guild, member, CASTER_ROLE_NAME, profile.is_caster, '#f1c40f');

            // Free Agent Role
            let isUserInTeam = inTeam;
            if (isUserInTeam === undefined) {
                const { data: teamMembership } = await SupabaseService.getTeamMembership(profile.id);
                isUserInTeam = !!teamMembership;
            }
            const isFreeAgent = profile.is_looking_for_team && !isUserInTeam;
            await this.handleSimpleRole(guild, member, FREE_AGENT_ROLE_NAME, isFreeAgent, '#2ecc71');
        } catch (error) {
            console.error(`[Sync] Error for ${profile.username}:`, error);
        }
    }

    private static async handleSimpleRole(guild: Guild, member: GuildMember, roleName: string, shouldHave: boolean, color: any) {
        let role = guild.roles.cache.find(r => r.name === roleName);
        if (shouldHave) {
            if (!role) {
                role = await guild.roles.create({ name: roleName, color, reason: 'Automatic sync' });
            }
            if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role);
                console.log(`[Sync] Added ${roleName} to ${member.user.username}`);
            }
        } else if (role && member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            console.log(`[Sync] Removed ${roleName} from ${member.user.username}`);
        }
    }

    static async syncTeam(client: Client, team: any) {
        const guild = await client.guilds.fetch(GUILD_ID!);
        
        // 1. Team Role
        const roleName = team.name;
        let role = guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            role = await guild.roles.create({
                name: roleName,
                color: Math.floor(Math.random() * 16777215),
                hoist: true,
                mentionable: true
            });
            console.log(`[Sync] Created role "${roleName}"`);
        } else if (!role.hoist) {
            await role.setHoist(true);
        }

        // 2. Team Channel
        const channels = await guild.channels.fetch();
        const channelName = team.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        let channel = channels.find(c => 
            c?.type === ChannelType.GuildText && 
            c.name === channelName && 
            (!TEAM_CATEGORY_ID || c.parentId === TEAM_CATEGORY_ID)
        );
        
        if (!channel) {
            const permissionOverwrites: OverwriteResolvable[] = [
                { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: role.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
            ];
            channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: TEAM_CATEGORY_ID || null,
                permissionOverwrites,
            });
            console.log(`[Sync] Created channel #${channelName}`);
        }
        return { role, channel };
    }

    static async syncTeamMember(client: Client, teamId: string, profileId: string, action: 'INSERT' | 'DELETE', skipUserRolesSync = false, teamData?: any, profileData?: any) {
        const guild = await client.guilds.fetch(GUILD_ID!);
        let team = teamData || (await supabase.from('teams').select('*').eq('id', teamId).single()).data;
        let profile = profileData || (await supabase.from('profiles').select('*').eq('id', profileId).single()).data;

        if (!team || !profile || !profile.discord_id) return;

        const role = guild.roles.cache.find(r => r.name === team.name);
        if (!role) {
            await this.syncTeam(client, team);
            return;
        }

        try {
            const member = await guild.members.fetch(profile.discord_id);
            if (!member) return;

            const tagPrefix = team.tag ? `[${team.tag}] ` : '';
            const newNickname = `${tagPrefix}${profile.username}`.substring(0, 32);

            if (action === 'INSERT') {
                if (!member.roles.cache.has(role.id)) await member.roles.add(role);
                if (member.nickname !== newNickname) {
                    try { await member.setNickname(newNickname); } catch (e) {}
                }
            } else {
                if (member.roles.cache.has(role.id)) await member.roles.remove(role);
                if (member.nickname === newNickname) {
                    try { await member.setNickname(null); } catch (e) {}
                }
            }
            if (!skipUserRolesSync) await this.syncUserRoles(client, profile, action === 'INSERT');
        } catch (error) {
            console.error(`[Sync] Error for member ${profile.username}:`, error);
        }
    }

    static async getNotificationChannel(client: Client) {
        const guildId = process.env.GUILD_ID;
        const channelId = process.env.NOTIFICATION_CHANNEL_ID;
        const guild = await client.guilds.fetch(guildId!);

        // 1. Try by ID from .env
        if (channelId) {
            try {
                const channel = await guild.channels.fetch(channelId);
                if (channel && channel.type === ChannelType.GuildText) return channel as TextChannel;
            } catch (e) {}
        }

        // 2. Try by Name
        const channelName = 'fwitter-league';
        const channels = await guild.channels.fetch();
        const existing = channels.find(c => c?.name === channelName && c.type === ChannelType.GuildText);
        if (existing) return existing as TextChannel;

        // 3. Create it
        console.log(`[Sync] Creating notification channel #${channelName}`);
        const newChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            topic: 'Annonces, Scrims et Patch Notes de FwitterLeague',
            reason: 'Auto-created by FwitterBot'
        });
        return newChannel;
    }

    static async fullSync(client: Client) {
        console.log('[Sync] Starting full synchronization...');
        const guild = await client.guilds.fetch(GUILD_ID!);
        if (!guild) return;

        // Ensure notification channel exists
        await this.getNotificationChannel(client);

        const { data: teams } = await supabase.from('teams').select('*');
        const teamMap = new Map(teams?.map(t => [t.id, t]) || []);
        if (teams) {
            for (const team of teams) await this.syncTeam(client, team);
        }

        const { data: allMemberships } = await supabase.from('team_members').select('*');
        const membershipMap = new Set(allMemberships?.map(m => m.profile_id) || []);
        const { data: profiles } = await supabase.from('profiles').select('*');
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        if (profiles) {
            for (const profile of profiles) {
                if (profile.discord_id) await this.syncUserRoles(client, profile, membershipMap.has(profile.id));
            }
        }

        if (allMemberships) {
            for (const membership of allMemberships) {
                const team = teamMap.get(membership.team_id);
                const profile = profileMap.get(membership.profile_id);
                await this.syncTeamMember(client, membership.team_id, membership.profile_id, 'INSERT', true, team, profile);
            }
        }
        console.log('[Sync] Full synchronization complete.');
    }
}
