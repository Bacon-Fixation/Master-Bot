const { Command } = require('discord.js-commando');

module.exports = class JoinCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'join',
      memberName: 'join',
      aliases: ['summon'],
      group: 'music',
      guildOnly: true,
      clientPermissions: ['SPEAK', 'CONNECT'],
      description:
        'Allows an Admin to summon the bot to your voice-channel when music is playing.'
    });
  }

  async run(message) {
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
    if (message.guild.triviaData.isTriviaRunning == true) {
      message.channel.send(':x: Please try after the trivia has ended!', {
        reply: { messageReference: message.id }
      });
      return;
    }
    if (message.guild.musicData.isPlaying != true) {
      message.channel.send(':x: Nothing is Playing', {
        reply: { messageReference: message.id }
      });
      return;
    }
    try {
      await voiceChannel.join();
      return;
    } catch {
      message.channel.send(
        ':x Something went wrong while attempting to move channels',
        { reply: { messageReference: message.id } }
      );
      return;
    }
  }
};
