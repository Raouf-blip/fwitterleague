import { Client, Guild, Role, ChannelType, PermissionsBitField, OverwriteResolvable, GuildMember, TextChannel } from 'discord.js';
import { supabase } from '../config/supabase';
import { SupabaseService } from './supabase.service';
import { ConfigService } from './config.service';

const CASTER_ROLE_NAME = 'Casteur';
const FREE_AGENT_ROLE_NAME = 'Agent Libre';

export class SyncService {
    static async syncUserRoles(client: Client, profile: any, inTeam?: boolean) {
        if (!profile.discord_id) return;
        const config = await ConfigService.getConfig();
        if (!config.guildId) return;
        const guild = await client.guilds.fetch(config.guildId);
        try {
            const member = await guild.members.fetch(profile.discord_id).catch(() => null);
            if (!member) {
                console.log(`[Sync] Member ${profile.username} (${profile.discord_id}) not found in guild, skipping.`);
                return;
            }

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
        const config = await ConfigService.getConfig();
        if (!config.guildId) return;
        const guild = await client.guilds.fetch(config.guildId);
        
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
        } else {
            if (!role.hoist) await role.setHoist(true);
        }

        // 2. Team Channel
        const channels = await guild.channels.fetch();
        const channelName = team.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        let channel = channels.find(c => 
            c?.type === ChannelType.GuildText && 
            c.name === channelName && 
            (!config.teamCategoryId || c.parentId === config.teamCategoryId)
        );
        
        if (!channel) {
            const permissionOverwrites: OverwriteResolvable[] = [
                { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: role.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
            ];
            channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: config.teamCategoryId || null,
                permissionOverwrites,
            });
            console.log(`[Sync] Created channel #${channelName}`);
        }
        return { role, channel };
    }

    static async syncTeamMember(client: Client, teamId: string, profileId: string, action: 'INSERT' | 'DELETE', skipUserRolesSync = false, teamData?: any, profileData?: any) {
        const config = await ConfigService.getConfig();
        if (!config.guildId) return;
        const guild = await client.guilds.fetch(config.guildId);
        let team = teamData || (await supabase.from('teams').select('*').eq('id', teamId).single()).data;
        let profile = profileData || (await supabase.from('profiles').select('*').eq('id', profileId).single()).data;

        if (!team || !profile || !profile.discord_id) return;

        const role = guild.roles.cache.find(r => r.name === team.name);
        if (!role) {
            await this.syncTeam(client, team);
            return;
        }

        try {
            const member = await guild.members.fetch(profile.discord_id).catch(() => null);
            if (!member) {
                console.log(`[Sync] Member ${profile.username} (${profile.discord_id}) not found in guild, skipping.`);
                return;
            }

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

    static async getOrCreateCategory(guild: Guild) {
        const config = await ConfigService.getConfig();
        if (config.teamCategoryId) {
            try {
                const category = await guild.channels.fetch(config.teamCategoryId);
                if (category && category.type === ChannelType.GuildCategory) return category;
            } catch (e) {}
        }

        const categoryName = 'FWITTER LEAGUE';
        let category = guild.channels.cache.find(c => c.name === categoryName && c.type === ChannelType.GuildCategory);
        
        if (!category) {
            category = await guild.channels.create({
                name: categoryName,
                type: ChannelType.GuildCategory,
            });
            console.log(`[Sync] Created category "${categoryName}"`);
        }
        
        if (config.teamCategoryId !== category.id) {
            await ConfigService.saveConfig({ teamCategoryId: category.id });
        }
        return category;
    }

    static async getOrCreateAnnouncementsCategory(guild: Guild) {
        const config = await ConfigService.getConfig();
        if (config.announcementsCategoryId) {
            try {
                const category = await guild.channels.fetch(config.announcementsCategoryId);
                if (category && category.type === ChannelType.GuildCategory) return category;
            } catch (e) {}
        }

        const categoryName = 'ANNONCES FWL';
        let category = guild.channels.cache.find(c => c.name === categoryName && c.type === ChannelType.GuildCategory);
        
        if (!category) {
            category = await guild.channels.create({
                name: categoryName,
                type: ChannelType.GuildCategory,
            });
            console.log(`[Sync] Created category "${categoryName}"`);
        }
        
        if (config.announcementsCategoryId !== category.id) {
            await ConfigService.saveConfig({ announcementsCategoryId: category.id });
        }
        return category;
    }

    static async getScrimChannel(client: Client) {
        const config = await ConfigService.getConfig();
        const guild = await client.guilds.fetch(config.guildId);
        const category = await this.getOrCreateAnnouncementsCategory(guild);

        if (config.scrimChannelId) {
            try {
                const channel = await guild.channels.fetch(config.scrimChannelId);
                if (channel && channel.type === ChannelType.GuildText) return channel as TextChannel;
            } catch (e) {}
        }

        const channelName = 'annonces-scrims';
        let channel = guild.channels.cache.find(c => c.name === channelName && c.parentId === category.id);
        
        if (!channel) {
            channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category.id,
                topic: 'Annonces et nouveaux Scrims FwitterLeague',
                permissionOverwrites: [
                    { id: guild.id, allow: [PermissionsBitField.Flags.ViewChannel], deny: [PermissionsBitField.Flags.SendMessages] }
                ]
            });
            console.log(`[Sync] Created scrim channel #${channelName}`);
        }

        if (config.scrimChannelId !== channel.id) {
            await ConfigService.saveConfig({ scrimChannelId: channel.id });
        }
        return channel as TextChannel;
    }

    static async getPatchNotesChannel(client: Client) {
        const config = await ConfigService.getConfig();
        const guild = await client.guilds.fetch(config.guildId);
        const category = await this.getOrCreateAnnouncementsCategory(guild);

        if (config.patchNotesChannelId) {
            try {
                const channel = await guild.channels.fetch(config.patchNotesChannelId);
                if (channel && channel.type === ChannelType.GuildText) return channel as TextChannel;
            } catch (e) {}
        }

        const channelName = 'patch-notes';
        let channel = guild.channels.cache.find(c => c.name === channelName && c.parentId === category.id);
        
        if (!channel) {
            channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category.id,
                topic: 'Notes de mise à jour de la plateforme FwitterLeague',
                permissionOverwrites: [
                    { id: guild.id, allow: [PermissionsBitField.Flags.ViewChannel], deny: [PermissionsBitField.Flags.SendMessages] }
                ]
            });
            console.log(`[Sync] Created patch notes channel #${channelName}`);
        }

        if (config.patchNotesChannelId !== channel.id) {
            await ConfigService.saveConfig({ patchNotesChannelId: channel.id });
        }
        return channel as TextChannel;
    }

    static async getMercatoChannel(client: Client) {
        const config = await ConfigService.getConfig();
        const guild = await client.guilds.fetch(config.guildId);
        const category = await this.getOrCreateAnnouncementsCategory(guild);

        if (config.mercatoChannelId) {
            try {
                const channel = await guild.channels.fetch(config.mercatoChannelId);
                if (channel && channel.type === ChannelType.GuildText) return channel as TextChannel;
            } catch (e) {}
        }

        const channelName = 'mercato';
        let channel = guild.channels.cache.find(c => c.name === channelName && c.parentId === category.id);
        
        if (!channel) {
            channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category.id,
                topic: 'Annonces des joueurs à la recherche d\'une équipe (Agents Libres)',
                permissionOverwrites: [
                    { id: guild.id, allow: [PermissionsBitField.Flags.ViewChannel], deny: [PermissionsBitField.Flags.SendMessages] }
                ]
            });
            console.log(`[Sync] Created mercato channel #${channelName}`);
        }

        if (config.mercatoChannelId !== channel.id) {
            await ConfigService.saveConfig({ mercatoChannelId: channel.id });
        }
        return channel as TextChannel;
    }

    static async fullSync(client: Client) {
        console.log('[Sync] Starting full synchronization...');
        const config = await ConfigService.getConfig();
        if (!config.guildId) return;
        const guild = await client.guilds.fetch(config.guildId);
        if (!guild) return;

        // Ensure category and notification channels exist
        await this.getScrimChannel(client);
        await this.getPatchNotesChannel(client);
        await this.getMercatoChannel(client);

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
