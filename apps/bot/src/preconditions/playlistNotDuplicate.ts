import { ApplyOptions } from '@sapphire/decorators';
import {
	AsyncPreconditionResult,
	Precondition,
	PreconditionOptions
} from '@sapphire/framework';
import type { ChatInputCommandInteraction, User } from 'discord.js';
import { trpcNode } from '../trpc';

@ApplyOptions<PreconditionOptions>({
	name: 'playlistNotDuplicate'
})
export class PlaylistNotDuplicate extends Precondition {
	public override async chatInputRun(
		interaction: ChatInputCommandInteraction
	): AsyncPreconditionResult {
		const playlistName = interaction.options.getString('playlist-name', true);

		const guildMember = interaction.user as User;

		try {
			const playlist = await trpcNode.playlist.getPlaylist.query({
				name: playlistName,
				userId: guildMember.id
			});
			console.error(playlist);
			if (playlist.playlist) throw new Error();
		} catch (error) {
			console.error(error);
			return this.error({
				message: `There is already a playlist named **${playlistName}** in your saved playlists!`
			});
		}

		return this.ok();
	}
}

declare module '@sapphire/framework' {
	export interface Preconditions {
		playlistNotDuplicate: never;
	}
}
