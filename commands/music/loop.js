const { Command } = require('discord.js-commando');

module.exports = class LoopCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'loop',
      aliases: [`repeat`],
      group: 'music',
      memberName: 'loop',
      guildOnly: true,
      description: 'Loop the currently playing song!'
    });
  }

  run(message) {
    if (!message.guild.musicData.isPlaying) {
      message.channel.send(':x: There is no song playing right now!', {
        reply: { messageReference: message.id }
      });
      return;
    } else if (
      message.guild.musicData.isPlaying &&
      message.guild.triviaData.isTriviaRunning
    ) {
      message.channel.send(':x: You cannot loop over a trivia!', {
        reply: { messageReference: message.id }
      });
      return;
    } else if (
      message.member.voice.channel.id !== message.guild.me.voice.channel.id
    ) {
      message.channel.send(
        `You must be in the same voice channel as the bot in order to use that!`,
        { reply: { messageReference: message.id } }
      );
      return;
    }

    if (message.guild.musicData.loopSong) {
      message.guild.musicData.loopSong = false;
      message.channel.send(
        `**${message.guild.musicData.nowPlaying.title}** is no longer playing on repeat :repeat: `
      );
    } else {
      message.guild.musicData.loopSong = true;
      message.channel.send(
        `**${message.guild.musicData.nowPlaying.title}** is now playing on repeat :repeat: `
      );
    }
  }
};
