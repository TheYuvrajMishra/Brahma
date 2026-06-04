import { Client, GatewayIntentBits, Message, TextBasedChannel } from 'discord.js';
import { Adapter } from './Adapter';
import { NormalizedMessage, PipelineResponse } from '../types/Message';
import { config } from '../config';

export class DiscordAdapter implements Adapter {
    private client: Client;
    private typingIntervals: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });
    }

    async init(onMessage: (msg: NormalizedMessage) => void): Promise<void> {
        if (!config.discordToken) {
            console.warn('Discord token not provided. DiscordAdapter will not connect.');
            return;
        }

        this.client.on('ready', () => {
            console.log(`DiscordAdapter ready! Logged in as ${this.client.user?.tag}`);
        });

        this.client.on('messageCreate', (message: Message) => {
            if (message.author.bot) return; // Ignore bots

            const normalized: NormalizedMessage = {
                user_id: message.author.id,
                platform: 'discord',
                channel_id: message.channel.id,
                content: message.content,
                timestamp: message.createdAt,
                message_id: message.id
            };

            // Start typing indicator
            if (message.channel.isTextBased() && 'sendTyping' in message.channel) {
                const channel = message.channel;
                channel.sendTyping().catch(console.error);
                const interval = setInterval(() => {
                    channel.sendTyping().catch(console.error);
                }, 9000);
                this.typingIntervals.set(message.id, interval);
            }

            onMessage(normalized);
        });

        await this.client.login(config.discordToken);
    }

    async emit(response: PipelineResponse): Promise<void> {
        if (!this.client.isReady()) return;
        
        // Stop typing indicator
        const interval = this.typingIntervals.get(response.originalMessage.message_id);
        if (interval) {
            clearInterval(interval);
            this.typingIntervals.delete(response.originalMessage.message_id);
        }
        
        try {
            const channel = await this.client.channels.fetch(response.originalMessage.channel_id) as TextBasedChannel;
            if (channel && 'send' in channel) {
                // If message is too long, chunk it
                const content = response.content;
                if (content.length > 2000) {
                    const chunks = content.match(/[\s\S]{1,1999}/g) || [];
                    for (const chunk of chunks) {
                        await channel.send(chunk);
                    }
                } else {
                    await channel.send(content);
                }
            }
        } catch (err) {
            console.error('Failed to send message via Discord:', err);
        }
    }
}
