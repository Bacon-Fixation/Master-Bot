const { Command } = require('discord.js-commando');
const Pagination = require('discord-paginationembed');

module.exports = class ShuffleQueueCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'shuffle',
      memberName: 'shuffle',
      group: 'music',
      description: 'Shuffle the song queue!',
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
      message.channel.send(':x: There is nothing playing right now!', {
        reply: { messageReference: message.id }
      });
      return;
    } else if (voiceChannel.id !== message.guild.me.voice.channel.id) {
      message.channel.send(
        `:no_entry: You must be in the same voice channel as the bot in order to use that!`,
        { reply: { messageReference: message.id } }
      );
      return;
    } else if (message.guild.musicData.loopSong) {
      message.channel.send(
        ':x: Turn off the **loop** command before using the **shuffle** command!',
        { reply: { messageReference: message.id } }
      );
      return;
    }
    if (message.guild.musicData.queue.length < 1) {
      message.channel.send(':x: There are no songs in queue!', {
        reply: { messageReference: message.id }
      });
      return;
    }

    shuffleQueue(message.guild.musicData.queue);

    const queueClone = message.guild.musicData.queue;
    const queueEmbed = new Pagination.FieldsEmbed()
      .setArray(queueClone)
      .setAuthorizedUsers([message.author.id])
      .setChannel(message.channel)
      .setElementsPerPage(10)
      .formatField('# - Song', function(e) {
        return `**${queueClone.indexOf(e) + 1}**: ${e.title}`;
      });

    queueEmbed.embed
      .setColor('#ff7373')
      .setTitle(':twisted_rightwards_arrows: New Music Queue!');
    queueEmbed.build();
  }
};

function shuffleQueue(queue) {
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
}
