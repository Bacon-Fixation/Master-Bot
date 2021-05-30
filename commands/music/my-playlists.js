const { Command } = require('discord.js-commando');
const db = require('quick.db');
const Pagination = require('discord-paginationembed');

module.exports = class MyPlaylistsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'my-playlists',
      aliases: ['mps', 'my-queues', 'my-saved-queues', 'playlists'],
      group: 'music',
      memberName: 'my-playlists',
      guildOnly: true,
      description: 'List your saved playlists'
    });
  }

  run(message) {
    // check if user has playlists or user is in the db
    const dbUserFetch = db.get(message.member.id);
    if (!dbUserFetch) {
      message.channel.send('You have zero saved playlists!', {
        reply: { messageReference: message.id }
      });
      return;
    }
    const savedPlaylistsClone = dbUserFetch.savedPlaylists;
    if (savedPlaylistsClone.length == 0) {
      message.channel.send('You have zero saved playlists!', {
        reply: { messageReference: message.id }
      });
      return;
    }
    const playlistsEmbed = new Pagination.FieldsEmbed()
      .setArray(savedPlaylistsClone)
      .setAuthorizedUsers([message.author.id])
      .setChannel(message.channel)
      .setElementsPerPage(5)
      .formatField('# - Playlist', function(e) {
        return `**${savedPlaylistsClone.indexOf(e) + 1}**: ${e.name}`;
      });

    playlistsEmbed.embed.setColor('#ff7373').setTitle('Saved Playlists');
    playlistsEmbed.build();
  }
};
