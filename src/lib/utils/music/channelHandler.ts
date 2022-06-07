import type { Queue } from './../queue/Queue';
import type { GuildMember, StageChannel } from 'discord.js';
import Logger from '../logger';

export async function manageStageChannel(
  voiceChannel: StageChannel,
  botUser: GuildMember,
  instance: Queue
) {
  // Stage Channel Permissions From Discord.js Doc's
  if (
    !botUser?.permissions.has(
      ('MANAGE_CHANNELS' && 'MUTE_MEMBERS' && 'MOVE_MEMBERS') || 'ADMINISTRATOR'
    )
  )
    return await instance.channel?.send({
      content: `:interrobang: Please make promote me to a Speaker in ${voiceChannel.name}, Missing permissions "Administrator" ***OR*** "Manage Channels, Mute Members, and Move Members" for Full Stage Channel Features.`
    });

  const title =
    instance.player.queue.current?.title.length! > 114
      ? `🎶 ${instance.player.queue.current?.title.slice(0, 114)}...`
      : `🎶 ${instance.player.queue.current?.title}`;

  if (!voiceChannel.stageInstance) {
    await voiceChannel
      .createStageInstance({
        topic: title,
        privacyLevel: 2 // Guild Only
      })
      .catch(error => {
        Logger.error('Failed to Create a Stage Instance.', error);
      });
  }

  if (botUser?.voice.suppress)
    await botUser?.voice.setSuppressed(false).catch((error: string) => {
      Logger.error('Failed to Set Suppressed to False.', error);
    });
  if (voiceChannel.stageInstance?.topic.startsWith('🎶')) {
    await voiceChannel.stageInstance?.setTopic(title).catch(error => {
      Logger.error('Failed to Set Topic.', error);
    });
  }
  return;
}
