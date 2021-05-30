const { Command } = require('discord.js-commando');
const db = require('quick.db');

module.exports = class SaveToPlaylistCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'remove-from-playlist',
      aliases: ['delete-song', 'remove-song'],
      group: 'music',
      memberName: 'remove-from-playlist',
      guildOnly: true,
      description: 'Remove a song from a saved playlist',
      args: [
        {
          key: 'playlist',
          prompt: 'What is the playlist you would like to delete a video from?',
          type: 'string'
        },
        {
          key: 'index',
          prompt:
            'What is the index of the video you would like to delete from your saved playlist?',
          type: 'string',
          validate: function validateIndex(index) {
            return index > 0;
          }
        }
      ]
    });
  }

  async run(message, { playlist, index }) {
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

    let found = false;
    let location;
    for (let i = 0; i < savedPlaylistsClone.length; i++) {
      if (savedPlaylistsClone[i].name == playlist) {
        found = true;
        location = i;
        break;
      }
    }
    if (found) {
      const urlsArrayClone = savedPlaylistsClone[location].urls;
      if (urlsArrayClone.length == 0) {
        message.channel.send(`**${playlist}** is empty!`, {
          reply: { messageReference: message.id }
        });
        return;
      }

      if (index > urlsArrayClone.length) {
        message.channel.send(
          `The index you provided is larger than the playlist's length`,
          { reply: { messageReference: message.id } }
        );
        return;
      }
      const title = urlsArrayClone[index - 1].title;
      urlsArrayClone.splice(index - 1, 1);
      savedPlaylistsClone[location].urls = urlsArrayClone;
      db.set(message.member.id, { savedPlaylists: savedPlaylistsClone });
      message.channel.send(
        `I removed **${title}** from **${savedPlaylistsClone[location].name}**`,
        { reply: { messageReference: message.id } }
      );
      return;
    } else {
      message.channel.send(`You have no playlist named **${playlist}**`, {
        reply: { messageReference: message.id }
      });
      return;
    }
  }
};
