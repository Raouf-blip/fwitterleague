import { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { SyncService } from '../services/sync.service';
import { ConfigService } from '../services/config.service';

export async function notifyNewFreeAgent(client: Client, profile: any) {
    if (!profile.is_looking_for_team) return;

    const channel = await SyncService.getMercatoChannel(client);
    if (!channel) {
        console.error('[Mercato] Could not find or create mercato channel');
        return;
    }

    const config = await ConfigService.getConfig();
    const websiteUrl = config.websiteUrl || 'https://fwitterleague.fr';
    const profileUrl = `${websiteUrl}/profile/${profile.username}`;

    const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle(`🆕 Un nouveau joueur cherche une équipe !`)
        .setDescription(`**${profile.username}** vient de se déclarer en recherche d'équipe.`)
        .setThumbnail(profile.avatar_url || null)
        .addFields(
            { name: 'Rang', value: profile.rank || 'Unranked', inline: true },
            { name: 'Rôles préférés', value: profile.preferred_roles?.join(', ') || 'Non défini', inline: true },
            { name: 'Riot ID', value: profile.riot_id || 'Non lié', inline: false },
        )
        .setTimestamp()
        .setFooter({ text: 'FwitterLeague Mercato' });

    if (profile.bio) {
        embed.addFields({ name: 'Bio', value: profile.bio.substring(0, 1024) });
    }

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Voir le profil complet')
                .setStyle(ButtonStyle.Link)
                .setURL(profileUrl),
        );

    try {
        await channel.send({ embeds: [embed], components: [row] });
        console.log(`[Mercato] Notification sent for user ${profile.username}`);
    } catch (error) {
        console.error('[Mercato] Error sending discord message:', error);
    }
}
