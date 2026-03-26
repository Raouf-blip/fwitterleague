import { supabase } from '../config/supabase';

export interface BotConfig {
    guildId: string;
    teamCategoryId: string;
    announcementsCategoryId: string;
    scrimChannelId: string;
    patchNotesChannelId: string;
    mercatoChannelId: string;
    websiteUrl: string;
}

export class ConfigService {
    private static config: BotConfig | null = null;

    static async getConfig(): Promise<BotConfig> {
        if (!this.config) {
            await this.loadConfig();
        }
        return this.config!;
    }

    static async loadConfig(): Promise<void> {
        try {
            const { data, error } = await supabase
                .from('bot_config')
                .select('*')
                .eq('id', 'default')
                .single();

            if (error || !data) {
                console.log('[Config] Using hardcoded defaults (check Supabase bot_config table)');
                this.config = {
                    guildId: process.env.GUILD_ID || '',
                    teamCategoryId: process.env.TEAM_CATEGORY_ID || '',
                    announcementsCategoryId: process.env.ANNOUNCEMENTS_CATEGORY_ID || '',
                    scrimChannelId: process.env.NOTIFICATION_CHANNEL_ID || '',
                    patchNotesChannelId: process.env.NOTIFICATION_CHANNEL_ID || '',
                    mercatoChannelId: process.env.MERCATO_CHANNEL_ID || '',
                    websiteUrl: process.env.WEBSITE_URL || 'https://fwitterleague.fr'
                };
            } else {
                this.config = {
                    guildId: data.guild_id || '',
                    teamCategoryId: data.team_category_id || '',
                    announcementsCategoryId: data.announcements_category_id || '',
                    scrimChannelId: data.scrim_channel_id || '',
                    patchNotesChannelId: data.patch_notes_channel_id || '',
                    mercatoChannelId: data.mercato_channel_id || '',
                    websiteUrl: data.website_url || 'https://fwitterleague.fr'
                };
            }
        } catch (error) {
            console.error('[Config] Error loading config from DB:', error);
        }
    }

    static async saveConfig(newConfig: Partial<BotConfig>): Promise<void> {
        try {
            const current = await this.getConfig();
            const updated = { ...current, ...newConfig };
            
            const { error } = await supabase
                .from('bot_config')
                .update({
                    guild_id: updated.guildId,
                    team_category_id: updated.teamCategoryId,
                    announcements_category_id: updated.announcementsCategoryId,
                    scrim_channel_id: updated.scrimChannelId,
                    patch_notes_channel_id: updated.patchNotesChannelId,
                    mercato_channel_id: updated.mercatoChannelId,
                    website_url: updated.websiteUrl
                })
                .eq('id', 'default');

            if (error) throw error;
            this.config = updated;
            console.log('[Config] Database configuration updated.');
        } catch (error) {
            console.error('[Config] Error saving config to DB:', error);
        }
    }
}
