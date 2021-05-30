const { Command } = require('discord.js-commando');
const db = require('quick.db');

module.exports = class VolumeCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'volume',
      aliases: ['change-volume', 'v', 'vol'],
      group: 'music',
      memberName: 'volume',
      guildOnly: true,
      description: 'Adjust song volume!',
      throttling: {
        usages: 1,
        duration: 5
      },
      args: [
        {
          key: 'wantedVolume',
          prompt:
            ':loud_sound: What volume would you like to set? from 1 to 200!',
          type: 'integer',
          // default: 25,
          validate: function(wantedVolume) {
            return wantedVolume >= 1 && wantedVolume <= 200;
          }
        }
      ]
    });
  }

  run(message, { wantedVolume }) {
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
    }
    const volume = wantedVolume / 100;
    message.guild.musicData.volume = volume;
    db.set(`${message.member.guild.id}.serverSettings.volume`, volume);
    message.guild.musicData.songDispatcher.setVolume(volume);
    message.channel.send(
      `:loud_sound: Setting the volume to: ${wantedVolume}%!`,
      {
        reply: { messageReference: message.id }
      }
    );
  }
};
