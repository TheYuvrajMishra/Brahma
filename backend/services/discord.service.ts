import { Client, GatewayIntentBits, Message, TextChannel } from 'discord.js';
import { OrchestratorService } from './orchestrator.service';
import dotenv from 'dotenv';

dotenv.config();

export class DiscordService {
    private client: Client;

    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
            ],
        });

        this.init();
    }

    private init() {
        this.client.once('clientReady', () => {
            console.log(`Brahma Discord Bot logged in as ${this.client.user?.tag}`);
        });

        this.client.on('messageCreate', async (message: Message) => {
            if (message.author.bot) return;
            
            // Trigger Brahma Orchestrator
            // We can add a prefix or mention check here if needed
            if (message.mentions.has(this.client.user!)) {
                const query = message.content.replace(`<@!${this.client.user?.id}>`, '').trim();
                
                if (message.channel.isTextBased()) {
                    await (message.channel as any).sendTyping();
                }
                const response = await OrchestratorService.run(query);
                
                // Handle long responses
                if (response.length > 2000) {
                    const chunks = response.match(/[\s\S]{1,2000}/g) || [];
                    for (const chunk of chunks) {
                        await message.reply(chunk);
                    }
                } else {
                    await message.reply(response);
                }
            }
        });
    }

    /**
     * Dynamic Control: Create a channel
     */
    async createChannel(guildId: string, name: string) {
        const guild = await this.client.guilds.fetch(guildId);
        return guild.channels.create({ name });
    }

    /**
     * Dynamic Control: Send message to specific channel
     */
    async sendMessage(channelId: string, content: string) {
        const channel = await this.client.channels.fetch(channelId);
        if (channel?.isTextBased()) {
            return (channel as TextChannel).send(content);
        }
    }

    async login() {
        if (!process.env.DISCORD_TOKEN) {
            console.error('DISCORD_TOKEN missing in .env');
            return;
        }
        await this.client.login(process.env.DISCORD_TOKEN);
    }
}
