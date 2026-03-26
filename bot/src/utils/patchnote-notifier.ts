import { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { SyncService } from '../services/sync.service';
import { ConfigService } from '../services/config.service';

export async function notifyNewPatchNote(client: Client, patchNote: any) {
    const channel = await SyncService.getPatchNotesChannel(client);
    if (!channel) {
        console.error('[PatchNote Notifier] Could not find or create patch notes channel');
        return;
    }

    const config = await ConfigService.getConfig();
    const websiteUrl = config.websiteUrl || 'https://fwitterleague.fr';
    const patchNotesUrl = `${websiteUrl}/patch-notes`; 

    const embed = new EmbedBuilder()
        .setColor(0x7289DA) // Discord Blurple
        .setTitle(`🚀 Mise à jour ${patchNote.version} : ${patchNote.title}`)
        .setDescription(`De nouvelles modifications ont été apportées à la plateforme !`)
        .addFields(
            { name: 'Version', value: patchNote.version, inline: true },
            { name: 'Date', value: new Date(patchNote.date).toLocaleDateString('fr-FR'), inline: true },
        )
        .setTimestamp()
        .setFooter({ text: 'FwitterLeague Patch Notes' });

    if (patchNote.categories && Array.isArray(patchNote.categories) && patchNote.categories.length > 0) {
        for (const cat of patchNote.categories) {
            const emoji = cat.emoji || '🔹';
            const label = cat.label || 'Divers';
            const items = Array.isArray(cat.items) 
                ? cat.items.map((item: string) => `• ${item}`).join('\n') 
                : 'Aucun détail spécifié';
            
            const truncatedItems = items.length > 500 ? items.substring(0, 500) + '...' : items;

            embed.addFields({ 
                name: `${emoji} ${label}`, 
                value: truncatedItems || 'Aucun détail' 
            });
        }
    }

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Lire le Patch Note complet')
                .setStyle(ButtonStyle.Link)
                .setURL(patchNotesUrl),
        );

    try {
        await channel.send({ embeds: [embed], components: [row] });
        console.log(`[PatchNote Notifier] Notification sent for patch ${patchNote.version}`);
    } catch (error) {
        console.error('[PatchNote Notifier] Error sending discord message:', error);
    }
}
