const { Command } = require('discord.js-commando');

module.exports = class LoopQueueCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'loopqueue',
      memberName: 'loopqueue',
      aliases: ['loop-queue', 'queue-loop'],
      group: 'music',
      description: 'Loop the queue x times! - (the default is 1 time)',
      guildOnly: true,
      args: [
        {
          key: 'numOfTimesToLoop',
          default: 1,
          type: 'integer',
          prompt: 'How many times do you want to loop the queue?'
        }
      ]
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
        `:no_entry: You must be in the same voice channel as the bot in order to use that!`,
        { reply: { messageReference: message.id } }
      );
      return;
    } else if (message.guild.musicData.queue.length == 0) {
      message.channel.send(`:x: I can't loop over an empty queue!`, {
        reply: { messageReference: message.id }
      });
      return;
    } else if (message.guild.musicData.loopSong) {
      message.channel.send(
        ':x: Turn off the **loop** command before using the **loopqueue** command',
        { reply: { messageReference: message.id } }
      );
      return;
    }

    if (message.guild.musicData.loopQueue) {
      message.guild.musicData.loopQueue = false;
      message.channel.send(
        ':repeat: The queue is no longer playing on **loop**'
      );
    } else {
      message.guild.musicData.loopQueue = true;
      message.channel.send(':repeat: The queue is now playing on **loop**');
    }
  }
};
