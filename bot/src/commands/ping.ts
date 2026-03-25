import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Répond avec Pong!'),
	async execute(interaction: CommandInteraction) {
		await interaction.reply('Pong!');
	},
};
