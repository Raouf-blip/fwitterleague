import { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { supabase } from '../config/supabase';
import { SyncService } from '../services/sync.service';

export async function notifyNewScrim(client: Client, scrim: any) {
    const channel = await SyncService.getNotificationChannel(client);
    if (!channel) {
        console.error('[Notifier] Could not find or create notification channel');
        return;
    }

    // Récupérer les infos du créateur
    const { data: creator } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', scrim.creator_id)
        .single();

    const websiteUrl = process.env.WEBSITE_URL || 'https://fwitterleague.fr';
    const scrimUrl = `${websiteUrl}/scrims/${scrim.id}`;

    const embed = new EmbedBuilder()
        .setColor(scrim.type === 'open' ? 0x00FF99 : 0xFF9900)
        .setTitle(scrim.type === 'open' ? '🆕 Nouveau Scrim Ouvert !' : '🆕 Nouveau Défi de Scrim !')
        .setDescription(`Un nouveau scrim a été créé sur la plateforme.`)
        .addFields(
            { name: 'Organisateur', value: creator?.username || 'Inconnu', inline: true },
            { name: 'Date & Heure', value: new Date(scrim.scheduled_at).toLocaleString('fr-FR'), inline: true },
            { name: 'Type', value: scrim.type === 'open' ? 'Pick-up (Ouvert à tous)' : 'Équipe vs Équipe', inline: true },
        )
        .setTimestamp()
        .setFooter({ text: 'FwitterLeague Notifications' });

    if (scrim.type === 'team') {
        const { data: challenger } = await supabase.from('teams').select('name').eq('id', scrim.challenger_team_id).single();
        const { data: challenged } = await supabase.from('teams').select('name').eq('id', scrim.challenged_team_id).single();
        
        if (challenger && challenged) {
            embed.addFields({ name: 'Matchup', value: `**${challenger.name}** vs **${challenged.name}**` });
        }
    }

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setLabel('S\'inscrire / Voir les détails')
                .setStyle(ButtonStyle.Link)
                .setURL(scrimUrl),
        );

    try {
        await channel.send({ embeds: [embed], components: [row] });
        console.log(`[Notifier] Notification sent for scrim ${scrim.id}`);
    } catch (error) {
        console.error('[Notifier] Error sending discord message:', error);
    }
}
