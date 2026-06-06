import { ISkill } from '../types/Skill';
import { DiscordAdapter } from '../adapters/DiscordAdapter';
import { ChannelType } from 'discord.js';

export class DiscordCreateChannel implements ISkill {
    name = 'discord-create-channel';
    description = 'Creates a new text or voice channel in the active Discord guild.';

    async execute(params: any): Promise<string> {
        const channelName = params.name || params.channelName || '';
        const channelTypeStr = (params.type || 'text').toLowerCase();

        if (!channelName) {
            return 'Failed to create channel: No channel name provided.';
        }

        const client = DiscordAdapter.clientInstance;
        if (!client || !client.isReady()) {
            return 'Failed to create channel: Discord client is not ready or active.';
        }

        try {
            // Retrieve active guild or fall back to the first available guild
            let guild = null;
            if (DiscordAdapter.lastActiveGuildId) {
                guild = client.guilds.cache.get(DiscordAdapter.lastActiveGuildId);
            }
            if (!guild) {
                guild = client.guilds.cache.first();
            }

            if (!guild) {
                return 'Failed to create channel: Bot is not connected to any Discord server (guild).';
            }

            const channelType = channelTypeStr === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;

            // Create the channel
            const createdChannel = await guild.channels.create({
                name: channelName,
                type: channelType
            });

            console.log(`[DiscordCreateChannel] Created channel: ${createdChannel.name} (ID: ${createdChannel.id})`);
            return `Successfully created Discord channel "${createdChannel.name}" (Type: ${channelTypeStr}) in server "${guild.name}".`;
        } catch (err: any) {
            console.error('[DiscordCreateChannel] Error creating channel:', err);
            return `Failed to create channel: ${err.message}`;
        }
    }
}
