import { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';

export async function notifyNewPatchNote(client: Client, patchNote: any) {
    const channelId = process.env.PATCH_NOTES_CHANNEL_ID;
    if (!channelId) {
        console.error('[PatchNote Notifier] PATCH_NOTES_CHANNEL_ID is not defined in .env');
        return;
    }

    const channel = await client.channels.fetch(channelId) as TextChannel;
    if (!channel) {
        console.error(`[PatchNote Notifier] Channel with ID ${channelId} not found`);
        return;
    }

    const websiteUrl = process.env.WEBSITE_URL || 'https://fwitterleague.fr';
    const patchNotesUrl = `${websiteUrl}/patch-notes`; // Or specific ID if website supports it

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

    // Show categories as a summary if they exist
    if (patchNote.categories && Array.isArray(patchNote.categories) && patchNote.categories.length > 0) {
        const categoriesList = patchNote.categories.map((c: any) => `• ${c.name || 'Divers'}`).join('\n');
        embed.addFields({ name: 'Contenu du Patch', value: categoriesList });
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
