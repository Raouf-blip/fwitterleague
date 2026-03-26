import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { SupabaseService } from '../services/supabase.service';

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Affiche le classement d\'un tournoi')
    .addStringOption(option => 
        option.setName('tournament')
            .setDescription('Le nom du tournoi')
            .setRequired(true)
            .setAutocomplete(true));

export async function autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();
    const { data: tournaments } = await SupabaseService.getTournaments();

    if (!tournaments) return interaction.respond([]);

    const filtered = tournaments
        .filter(t => t.name.toLowerCase().includes(focusedValue.toLowerCase()))
        .slice(0, 25);

    await interaction.respond(
        filtered.map(t => ({ name: t.name, value: t.id }))
    );
}

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const tournamentId = interaction.options.getString('tournament')!;
    
    // Check if tournament exists (id might be name if autocomplete failed/not used)
    let { data: tournament } = await SupabaseService.getTournamentById(tournamentId);
    
    if (!tournament) {
        // Try searching by name if ID lookup failed
        const { data: foundByName } = await SupabaseService.getTournamentByName(tournamentId);
        tournament = foundByName;
    }

    if (!tournament) {
        return interaction.editReply('Tournoi introuvable. Veuillez utiliser les suggestions de l\'autocomplétion.');
    }

    const [ { data: registrations }, { data: matches } ] = await Promise.all([
        SupabaseService.getTournamentRegistrations(tournament.id),
        SupabaseService.getTournamentMatches(tournament.id)
    ]);

    if (!registrations || registrations.length === 0) {
        return interaction.editReply(`Aucune équipe n'est encore inscrite au tournoi **${tournament.name}**.`);
    }

    const teamStats: Record<string, { name: string; wins: number; losses: number }> = {};

    registrations.forEach((reg: any) => {
        teamStats[reg.team_id] = { name: reg.teams.name, wins: 0, losses: 0 };
    });

    if (matches) {
        matches.forEach((match: any) => {
            if (match.winner_id) {
                const loserId = match.winner_id === match.team_1_id ? match.team_2_id : match.team_1_id;
                if (teamStats[match.winner_id]) teamStats[match.winner_id].wins++;
                if (teamStats[loserId]) teamStats[loserId].losses++;
            }
        });
    }

    const standings = Object.entries(teamStats)
        .map(([id, stats]) => ({
            id,
            ...stats,
            total: stats.wins + stats.losses,
            winrate: (stats.wins + stats.losses) > 0 ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100) : 0
        }))
        .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

    const embed = new EmbedBuilder()
        .setTitle(`🏆 Classement : ${tournament.name}`)
        .setColor('#f1c40f')
        .setDescription(tournament.description || 'Classement actuel des équipes')
        .setTimestamp();

    let leaderboardText = '```\n#   Équipe              V - D   %\n';
    leaderboardText += '-------------------------------------\n';

    standings.forEach((team, index) => {
        const rank = (index + 1).toString().padEnd(3);
        const name = team.name.substring(0, 18).padEnd(20);
        const record = `${team.wins}-${team.losses}`.padEnd(7);
        const winrate = `${team.winrate}%`;
        
        leaderboardText += `${rank} ${name} ${record} ${winrate}\n`;
    });

    leaderboardText += '```';

    embed.addFields({ name: '\u200B', value: leaderboardText });

    await interaction.editReply({ embeds: [embed] });
}
