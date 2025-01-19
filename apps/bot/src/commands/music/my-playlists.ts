import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { PaginatedFieldMessageEmbed } from '@sapphire/discord.js-utilities';
import { EmbedBuilder } from 'discord.js';
import { trpcNode } from '../../trpc';

@ApplyOptions<CommandOptions>({
	name: 'my-playlists',
	description: "Display your custom playlists' names",
	preconditions: [
		'GuildOnly',
		'isCommandDisabled',
		'inVoiceChannel',
		'userInDB'
	]
})
export class MyPlaylistsCommand extends Command {
	public override registerApplicationCommands(
		registry: Command.Registry
	): void {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction
	) {
		const interactionUser = interaction.user;

		if (!interactionUser) {
			return await interaction.reply({
				content: ':x: Something went wrong! Please try again later'
			});
		}

		const baseEmbed = new EmbedBuilder().setColor('Purple').setAuthor({
			name: `${interactionUser.displayName}`,
			iconURL:
				interactionUser.displayAvatarURL() || interactionUser.defaultAvatarURL
		});

		const playlistsQuery = await trpcNode.playlist.getAll.query({
			userId: interactionUser.id
		});

		if (!playlistsQuery || !playlistsQuery.playlists.length) {
			return await interaction.reply(':x: You have no custom playlists');
		}

		const emdeds = new PaginatedFieldMessageEmbed()
			.setTitleField('Custom Playlists')
			.setTemplate(baseEmbed)
			.setItems(playlistsQuery.playlists)
			.formatItems((playlist: any) => playlist.name)
			.setItemsPerPage(5)
			.make();

		const response = emdeds;
		console.log(response);
		//@ts-ignore
		return; // interaction.reply({ embeds: response[0][0] });
	}
}
