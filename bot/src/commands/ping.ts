import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond avec Pong!')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: CommandInteraction) {
    await interaction.reply('Pong!');
}
