import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche la liste des commandes disponibles');

export async function execute(interaction: ChatInputCommandInteraction) {
    const commands = (interaction.client as any).commands;
    
    const embed = new EmbedBuilder()
        .setTitle('📚 Aide - FwitterBot')
        .setDescription('Voici la liste des commandes que vous pouvez utiliser :')
        .setColor('#2ecc71')
        .setThumbnail(interaction.client.user?.displayAvatarURL() || null);

    const commandList = commands.map((cmd: any) => {
        // Vérifier si la commande a des permissions par défaut (comme /ping)
        const permissions = cmd.data.default_member_permissions;
        let lockEmoji = '';
        
        if (permissions) {
            // Si l'utilisateur n'est pas admin, on peut mettre un petit cadenas
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
                lockEmoji = ' 🔒';
            }
        }

        return `**/${cmd.data.name}**${lockEmoji}\n${cmd.data.description}`;
    }).join('\n\n');

    embed.addFields({ name: 'Commandes', value: commandList });
    
    embed.setFooter({ text: 'Les commandes avec 🔒 sont réservées aux administrateurs.' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
}
