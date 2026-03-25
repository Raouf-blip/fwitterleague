import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { SupabaseService } from '../services/supabase.service';

export const data = new SlashCommandBuilder()
    .setName('team')
    .setDescription('Affiche les détails d\'une équipe')
    .addStringOption(option => 
        option.setName('name')
            .setDescription('Le nom de l\'équipe')
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const teamName = interaction.options.getString('name')!;
    const { data: team } = await SupabaseService.getTeamByName(teamName);

    if (!team) {
        return interaction.editReply('Équipe introuvable.');
    }

    const { data: members } = await SupabaseService.getTeamMembers(team.id);

    const embed = new EmbedBuilder()
        .setTitle(`Équipe : ${team.name} [${team.tag || '?'}]`)
        .setColor('#e74c3c')
        .setThumbnail(team.logo_url || null)
        .addFields(
            { name: 'Capitaine', value: (team.profiles as any)?.username || 'Inconnu', inline: true },
            { name: 'Membres', value: members?.length ? members.map((m: any) => `• **${m.profiles.username}** (${m.profiles.rank || '?'})`).join('\n') : 'Aucun membre', inline: false }
        );

    if (team.description) {
        embed.setDescription(team.description);
    }

    await interaction.editReply({ embeds: [embed] });
}
