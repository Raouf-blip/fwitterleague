import { SlashCommandBuilder, CommandInteraction, PermissionsBitField, ChannelType, EmbedBuilder, MessageFlags } from 'discord.js';
import { ConfigService } from '../services/config.service';
import { supabase } from '../config/supabase';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Gérer la configuration du bot (Admins uniquement)')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Afficher la configuration actuelle'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set_guild')
                .setDescription('Définir l\'ID du serveur Discord')
                .addStringOption(option => 
                    option.setName('guild_id').setDescription('ID du serveur Discord').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set_teams_channel_group')
                .setDescription('Définir le groupe de salons (catégorie) pour les équipes')
                .addChannelOption(option => 
                    option.setName('category').setDescription('Groupe de salons Discord').addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set_announcements_channel_group')
                .setDescription('Définir le groupe de salons (catégorie) pour les annonces')
                .addChannelOption(option => 
                    option.setName('category').setDescription('Groupe de salons Discord').addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set_scrim_channel')
                .setDescription('Définir le salon des annonces de scrims')
                .addChannelOption(option => 
                    option.setName('channel').setDescription('Salon textuel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set_patch_channel')
                .setDescription('Définir le salon des patch notes')
                .addChannelOption(option => 
                    option.setName('channel').setDescription('Salon textuel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set_mercato_channel')
                .setDescription('Définir le salon des annonces mercato')
                .addChannelOption(option => 
                    option.setName('channel').setDescription('Salon textuel').addChannelTypes(ChannelType.GuildText).setRequired(true))),

    async execute(interaction: CommandInteraction) {
        if (!interaction.isChatInputCommand()) return;

        // On informe Discord qu'on va prendre un peu de temps (évite l'erreur Unknown Interaction)
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const subcommand = interaction.options.getSubcommand();
        const config = await ConfigService.getConfig();

        if (subcommand === 'show') {
            const embed = new EmbedBuilder()
                .setTitle('⚙️ Configuration du Bot (Base de données)')
                .addFields(
                    { name: 'Serveur ID', value: config.guildId || 'Non défini', inline: true },
                    { name: 'Groupe Teams', value: config.teamCategoryId || 'Non défini', inline: true },
                    { name: 'Groupe Annonces', value: config.announcementsCategoryId || 'Non défini', inline: true },
                    { name: 'Salon Scrims', value: config.scrimChannelId || 'Non défini', inline: true },
                    { name: 'Salon Patch Notes', value: config.patchNotesChannelId || 'Non défini', inline: true },
                    { name: 'Salon Mercato', value: config.mercatoChannelId || 'Non défini', inline: true },
                    { name: 'URL Site Web', value: config.websiteUrl || 'https://fwitterleague.fr', inline: false }
                )
                .setColor(0x3498db)
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        if (subcommand === 'set_guild') {
            const guildId = interaction.options.getString('guild_id', true);
            await ConfigService.saveConfig({ guildId });
            return interaction.editReply({ content: `✅ Serveur ID mis à jour : \`${guildId}\`` });
        }

        if (subcommand === 'set_teams_channel_group') {
            const category = interaction.options.getChannel('category', true);
            await ConfigService.saveConfig({ teamCategoryId: category.id });
            return interaction.editReply({ content: `✅ Groupe de salons des équipes mis à jour : <#${category.id}> (\`${category.id}\`)` });
        }

        if (subcommand === 'set_announcements_channel_group') {
            const category = interaction.options.getChannel('category', true);
            await ConfigService.saveConfig({ announcementsCategoryId: category.id });
            return interaction.editReply({ content: `✅ Groupe de salons des annonces mis à jour : <#${category.id}> (\`${category.id}\`)` });
        }

        if (subcommand === 'set_scrim_channel') {
            const channel = interaction.options.getChannel('channel', true);
            await ConfigService.saveConfig({ scrimChannelId: channel.id });
            return interaction.editReply({ content: `✅ Salon des scrims mis à jour : <#${channel.id}>` });
        }

        if (subcommand === 'set_patch_channel') {
            const channel = interaction.options.getChannel('channel', true);
            await ConfigService.saveConfig({ patchNotesChannelId: channel.id });
            return interaction.editReply({ content: `✅ Salon des patch notes mis à jour : <#${channel.id}>` });
        }

        if (subcommand === 'set_mercato_channel') {
            const channel = interaction.options.getChannel('channel', true);
            await ConfigService.saveConfig({ mercatoChannelId: channel.id });
            return interaction.editReply({ content: `✅ Salon du mercato mis à jour : <#${channel.id}>` });
        }
    },
};
