const { Command } = require('discord.js-commando');
const { prefix } = require('../../config.json');

module.exports = class SkipCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'skip',
      aliases: ['skip-song', 'advance-song', 'next'],
      memberName: 'skip',
      group: 'music',
      description: 'Skip the current playing song!',
      guildOnly: true
    });
  }

  run(message) {
    const voiceChannel = message.member.voice.channel;
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
    } else if (message.guild.triviaData.isTriviaRunning) {
      message.channel.send(`You can't skip a trivia! Use ${prefix}end-trivia`, {
        reply: { messageReference: message.id }
      });
      return;
    }
    message.guild.musicData.loopSong = false;
    message.guild.musicData.songDispatcher.end();
  }
};
