const { Command } = require('discord.js-commando');

module.exports = class SkipAllCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'skipall',
      aliases: ['skip-all'],
      memberName: 'skipall',
      group: 'music',
      description: 'Skip all songs in queue!',
      guildOnly: true
    });
  }

  run(message) {
    var voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      message.channel.send(
        ':no_entry: Please join a voice channel and try again!',
        {
          reply: { messageReference: message.id }
        }
      );
      return;
    }

    if (
      typeof message.guild.musicData.songDispatcher == 'undefined' ||
      message.guild.musicData.songDispatcher == null
    ) {
      message.channel.send(':x: There is no song playing right now!', {
        reply: { messageReference: message.id }
      });
      return;
    } else if (voiceChannel.id !== message.guild.me.voice.channel.id) {
      message.channel.send(
        `:no_entry: You must be in the same voice channel as the bot in order to use that!`,
        { reply: { messageReference: message.id } }
      );
      return;
    }
    if (!message.guild.musicData.queue) {
      message.channel.send(':x: There are no songs in queue!', {
        reply: { messageReference: message.id }
      });
      return;
    }
    message.guild.musicData.queue.length = 0; // clear queue
    message.guild.musicData.loopSong = false;
    message.guild.musicData.loopQueue = false;
    message.guild.musicData.songDispatcher.end();
    return;
  }
};
