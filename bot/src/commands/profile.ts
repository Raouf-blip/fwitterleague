import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { SupabaseService } from '../services/supabase.service';
import { supabase } from '../config/supabase';

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Affiche le profil d\'un joueur')
    .addUserOption(option =>
        option.setName('discord_user')
            .setDescription('Mentionner un utilisateur Discord')
            .setRequired(false))
    .addStringOption(option =>
        option.setName('fwitterleague_user')
            .setDescription('Pseudo utilisé sur la plateforme web')
            .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('discord_user');
    const targetUsername = interaction.options.getString('fwitterleague_user');

    let profile;
    if (targetUser) {
        const { data } = await SupabaseService.getProfileByDiscordId(targetUser.id);
        profile = data;
    } else if (targetUsername) {
        const { data } = await SupabaseService.getProfileByUsername(targetUsername);
        profile = data;
    } else {
        const { data } = await SupabaseService.getProfileByDiscordId(interaction.user.id);
        profile = data;
    }

    if (!profile) {
        return interaction.editReply('Profil introuvable sur la plateforme.');
    }

    // Récupérer l'équipe du joueur
    const { data: membership } = await supabase
        .from('team_members')
        .select('teams(name)')
        .eq('profile_id', profile.id)
        .maybeSingle();

    const teamName = (membership?.teams as any)?.name || 'Sans équipe';

    const embed = new EmbedBuilder()
        .setTitle(`Profil de ${profile.username}`)
        .setColor('#0099ff')
        .setThumbnail(profile.avatar_url || null)
        .addFields(
            { name: 'Équipe', value: teamName, inline: false },
            { name: 'Rang', value: profile.rank || 'Unranked', inline: true },
            { name: 'LP', value: `${profile.lp || 0}`, inline: true },
            { name: 'Winrate', value: `${profile.winrate || 0}%`, inline: true },
            { name: 'Rôles préférés', value: profile.preferred_roles?.join(', ') || 'Non défini', inline: false },
            { name: 'Riot ID', value: profile.riot_id || 'Non lié', inline: true },
            { name: 'Casteur', value: profile.is_caster ? 'Oui' : 'Non', inline: true },
        );

    if (profile.bio) {
        embed.setDescription(profile.bio);
    }

    await interaction.editReply({ embeds: [embed] });
}
