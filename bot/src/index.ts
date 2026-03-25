import { Client, Events, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  throw new Error('Missing DISCORD_TOKEN or CLIENT_ID in environment variables');
}

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Command collection
(client as any).commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		(client as any).commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data: any = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId || ''),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

import { notifyNewScrim } from './utils/scrim-notifier';
import { notifyNewPatchNote } from './utils/patchnote-notifier';
import { supabase } from './config/supabase';

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, (readyClient: Client<true>) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    // Subscribe to new scrims
    supabase
        .channel('new-scrims')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scrims' }, (payload) => {
            console.log('[Realtime] New scrim detected:', payload.new.id);
            notifyNewScrim(readyClient, payload.new);
        })
        .subscribe();
    
    // Subscribe to new patch notes
    supabase
        .channel('new-patchnotes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'patch_notes' }, (payload) => {
            console.log('[Realtime] New patch note detected:', payload.new.id);
            notifyNewPatchNote(readyClient, payload.new);
        })
        .subscribe();
    
    console.log('[Realtime] Listening for new scrims and patch notes...');
});

// Handle commands
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = (client as any).commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// Log in to Discord with your client's token
client.login(token);
