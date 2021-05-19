const { oneLine } = require('common-tags');
const { Command } = require('discord.js-commando');
const db = require('quick.db');

module.exports = class EnableCommandCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'enable',
      aliases: ['enable-command', 'cmd-on', 'command-on'],
      group: 'commands',
      memberName: 'enable',
      description: 'Enables a command or command group.',
      details: oneLine`
				The argument must be the name/ID (partial or whole) of a command or command group.
				Only administrators may use this command.
			`,
      examples: ['enable util', 'enable Utility', 'enable prefix'],
      guarded: true,
      guildOnly: true,
      args: [
        {
          key: 'cmdOrGrp',
          label: 'command/group',
          prompt: 'Which command or group would you like to enable?',
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
    const clonedDB = db.get(
      `${message.guild.id}.serverSettings.disabledCommands`
    );
    //db.set(`${message.guild.id}.serverSettings.disabledCommands`, []);

    const group = args.cmdOrGrp.group;
    if (args.cmdOrGrp.isEnabledIn(message.guild, true)) {
      return message.reply(
        `The **${args.cmdOrGrp.name}** ${
          args.cmdOrGrp.group ? 'command' : 'group'
        } is already enabled${
          group && !group.isEnabledIn(message.guild)
            ? `, but the **${group.name}** group is disabled, so it still can't be used`
            : ''
        }.`
      );
    }
    args.cmdOrGrp.setEnabledIn(message.guild, true);
    if (clonedDB) {
      const index = clonedDB.indexOf(
        args.cmdOrGrp.group ? args.cmdOrGrp.memberName : args.cmdOrGrp.id
      );
      if (index > -1) {
        db.set(
          `${message.guild.id}.serverSettings.disabledCommands`,
          arrayRemove(
            clonedDB,
            args.cmdOrGrp.group ? args.cmdOrGrp.memberName : args.cmdOrGrp.id
          )
        );
      }
    }

    return message.reply(
      `Enabled the **${args.cmdOrGrp.name}** ${group ? 'command' : 'group'}${
        group && !group.isEnabledIn(message.guild)
          ? `, but the **${group.name}** group is disabled, so it still can't be used`
          : ''
      }.`
    );

    function arrayRemove(array, value) {
      return array.filter(function(elements) {
        return elements != value;
      });
    }
  }
};
