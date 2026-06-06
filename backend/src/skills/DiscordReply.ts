import { ISkill } from '../types/Skill';
import { DiscordAdapter } from '../adapters/DiscordAdapter';

export class DiscordReply implements ISkill {
    name = 'discord-reply';
    description = 'Formats a response for Discord markdown and delivers it via Discord adapter.';

    async execute(params: any): Promise<string> {
        const content = params.content || '';
        const formattedContent = content;

        const client = DiscordAdapter.clientInstance;
        if (!client || !client.isReady()) {
            console.log('[DiscordReply] Discord client not ready or not registered. Returning formatted content.');
            return formattedContent;
        }

        try {
            let targetUser = null;
            
            // Try to find in cache first
            targetUser = client.users.cache.find(u => 
                u.username.toLowerCase().includes('yuvraj') || 
                u.globalName?.toLowerCase().includes('yuvraj')
            );
            
            if (!targetUser) {
                // Search in guilds using a timeout to prevent hanging/slowness
                for (const guild of client.guilds.cache.values()) {
                    try {
                        const searchPromise = guild.members.search({ query: 'yuvraj', limit: 5 });
                        const matchedMembers = await Promise.race([
                            searchPromise,
                            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Search timeout')), 1500))
                        ]);
                        
                        const member = matchedMembers.find((m: any) => 
                            m.user.username.toLowerCase().includes('yuvraj') || 
                            m.user.globalName?.toLowerCase().includes('yuvraj') ||
                            m.displayName.toLowerCase().includes('yuvraj')
                        );
                        if (member) {
                            targetUser = member.user;
                            break;
                        }
                    } catch (err) {
                        // Skip guild search failures or timeouts
                    }
                }
            }

            if (targetUser) {
                const dmChannel = await targetUser.createDM();
                await dmChannel.send(formattedContent);
                console.log(`[DiscordReply] Sent Discord DM to ${targetUser.tag}`);
                return `Successfully sent Discord DM to ${targetUser.username}: "${formattedContent}"`;
            }

            // Fallback: send to the first text channel in the first guild
            const firstGuild = client.guilds.cache.first();
            if (firstGuild) {
                const channel = firstGuild.channels.cache.find(c => c.isTextBased());
                if (channel && 'send' in channel) {
                    await (channel as any).send(`[To Yuvraj]: ${formattedContent}`);
                    console.log(`[DiscordReply] Sent fallback message to channel ${channel.id} in guild ${firstGuild.name}`);
                    return `Successfully sent Discord message to channel ${(channel as any).name || channel.id}: "${formattedContent}"`;
                }
            }

            return `Formatted content: "${formattedContent}" (No active Discord guilds or users found)`;
        } catch (err: any) {
            console.error('[DiscordReply] Failed to send Discord message:', err);
            return `Formatted content: "${formattedContent}" (Delivery failed: ${err.message})`;
        }
    }
}
