const { oneLine } = require('common-tags');
const { Command } = require('discord.js-commando');
const db = require('quick.db');

module.exports = class DisableCommandCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'disable',
      aliases: ['disable-command', 'cmd-off', 'command-off'],
      group: 'commands',
      memberName: 'disable',
      description: 'Disables a command or command group.',
      details: oneLine`
				The argument must be the name/ID (partial or whole) of a command or command group.
				Only administrators may use this command.
			`,
      examples: ['disable util', 'disable Utility', 'disable prefix'],
      guarded: true,
      guildOnly: true,
      args: [
        {
          key: 'cmdOrGrp',
          label: 'command/group',
          prompt: 'Which command or group would you like to disable?',
          type: 'group|command'
        }
      ]
    });
  }

  hasPermission(message) {
    if (!message.guild) return this.client.isOwner(message.author);
    return (
      message.member.permissions.has('ADMINISTRATOR') ||
      this.client.isOwner(message.author)
    );
  }

  run(message, args) {
    if (!args.cmdOrGrp.isEnabledIn(message.guild, true)) {
      return message.reply(
        `The **${args.cmdOrGrp.name}** ${
          args.cmdOrGrp.group ? 'command' : 'group'
        } is already disabled.`
      );
    }
    if (args.cmdOrGrp.guarded) {
      return message.reply(
        `You cannot disable the **${args.cmdOrGrp.name}** ${
          args.cmdOrGrp.group ? 'command' : 'group'
        }.`
      );
    }
    args.cmdOrGrp.setEnabledIn(message.guild, false);
    args.cmdOrGrp.group
      ? db.push(
          `${message.guild.id}.serverSettings.disabledCommands`,
          args.cmdOrGrp.name
        )
      : db.push(
          `${message.guild.id}.serverSettings.disabledCommands`,
          args.cmdOrGrp.id
        );
    return message.reply(
      `Disabled the **${args.cmdOrGrp.name}** ${
        args.cmdOrGrp.group ? 'command' : 'group'
      }.`
    );
  }
};
