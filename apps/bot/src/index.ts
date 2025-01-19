import { ExtendedClient } from './lib/structures/ExtendedClient';
import { env } from './env';
import { load } from '@lavaclient/spotify';
import {
	ApplicationCommandRegistries,
	RegisterBehavior
} from '@sapphire/framework';
import Logger from './lib/logger';
import { notify } from './lib/twitch/notifyChannels';
import { trpcNode } from './trpc';
import buttonsCollector from './lib/music/buttonsCollector';

if (env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET) {
	load({
		client: {
			id: env.SPOTIFY_CLIENT_ID,
			secret: env.SPOTIFY_CLIENT_SECRET
		},
		autoResolveYoutubeTracks: true
	});
}

const client = new ExtendedClient();
client.on('ready', async () => {
	// client.rest
	// 	.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: [] })
	// 	.then(() => console.log('Successfully deleted all application commands.'))
	// 	.catch(console.error);
	ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
		RegisterBehavior.Overwrite
	);

	client.music.connect(client.user!.id);

	client.user?.setStatus('online');
	client.guilds.cache.map(async guild => {
		const queue = client.music.queues.get(guild.id);

		// grab last known voice state of bot
		const voiceState = await guild.voiceStates.cache.find(
			user => user.id == client.application?.id
		);

		// update lavalink manually if the bot is still in voice chat after restart
		const customVoiceStateUpdate = {
			session_id: voiceState?.sessionId,
			channel_id: voiceState?.channel?.id,
			guild_id: voiceState?.guild.id,
			user_id: guild.members.me?.id
		};
		if (queue) {
			if (guild.members.me?.voice) {
				if (!customVoiceStateUpdate.channel_id) return;
				queue.createPlayer();
				queue.connect(customVoiceStateUpdate.channel_id);
				await queue.start();

				const song = await queue.getCurrentTrack();
				if (song) {
					const channel = guild.channels.cache.get(
						(await queue.getTextChannelID()) as string
					);
					// remake the message collector so buttons will work again after restart
					if (channel?.isTextBased()) {
						const message = await channel.messages.fetch(
							(await queue.getEmbed()) as string
						);

						if (queue.player) {
							try {
								await buttonsCollector(message, song);
							} catch (e) {
								console.log(e);
							}
						}
					}
				}
			}
		}
	});
	const token = client.twitch.auth.access_token;
	if (!token) return;

	// happens to be the first DB call at start up
	try {
		const notifyDB = await trpcNode.twitch.getAll.query();

		const query: string[] = [];
		for (const user of notifyDB.notifications) {
			query.push(user.twitchId);
			client.twitch.notifyList[user.twitchId] = {
				sendTo: user.channelIds,
				logo: user.logo,
				live: user.live,
				messageSent: user.sent,
				messageHandler: {}
			};
		}
		await notify(query).then(() =>
			setInterval(async () => {
				const newQuery: string[] = [];
				// pickup newly added entries
				for (const key in client.twitch.notifyList) {
					newQuery.push(key);
				}
				await notify(newQuery);
			}, 60 * 1000)
		);
		const getStatusCache = async () => {
			const response = [
				{ name: 'Beta Music Features', type: 4 },
				{ name: 'YouTube - Online', type: 4 },
				{ name: 'SoundCloud - Online', type: 4 },
				{ name: 'Vimeo - Online', type: 4 },
				{ name: 'Twitch - Audio Only', type: 4 },
				{ name: 'Spotify - Limited', type: 4 }
			];

			return response;
		};
		const startStatusRotation = async () => {
			let index = 0;
			setInterval(async () => {
				let statusArray = await getStatusCache();

				client.user?.setPresence({ activities: [statusArray[index]] });
				index = (index + 1) % statusArray.length;
			}, 5000);
		};
		startStatusRotation();
	} catch (err) {
		Logger.error('Prisma ' + err);
	}
});

client.on('chatInputCommandError', err => {
	console.log('Command Chat Input ' + err);
});
client.on('contextMenuCommandError', err => {
	console.log('Command Context Menu ' + err);
});
client.on('commandAutocompleteInteractionError', err => {
	console.log('Command Autocomplete ' + err);
});
client.on('commandApplicationCommandRegistryError', err => {
	console.log('Command Registry ' + err);
});
client.on('messageCommandError', err => {
	console.log('Command ' + err);
});
client.on('interactionHandlerError', err => {
	console.log('Interaction ' + err);
});
client.on('interactionHandlerParseError', err => {
	console.log('Interaction Parse ' + err);
});

client.on('listenerError', err => {
	console.log('Client Listener ' + err);
});

// LavaLink
client.music.on('error', err => {
	console.log('LavaLink ' + err);
});

const main = async () => {
	try {
		await client.login(env.DISCORD_TOKEN);
	} catch (error) {
		console.log('Bot errored out', error);
		client.destroy();
		process.exit(1);
	}
};

void main();
