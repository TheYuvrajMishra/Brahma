import * as fs from 'fs';
import * as path from 'path';
import { Client, GatewayIntentBits, ChannelType, Guild, GuildChannel, Role, GuildMember } from 'discord.js';
import { LLMService, LLMMessage } from './llm.service';
import { RAGService } from './rag.service';
import { OrchestratorService } from './orchestrator.service';
import { Dharma } from '../models';
import { ContextService } from './context.service';
import { GmailService } from './gmail.service';

export interface DiscordAction {
  action: string;
  params: Record<string, any>;
}

export interface DiscordServiceStatus {
  connected: boolean;
  mode: 'live' | 'mock';
  guildName?: string;
  guildId?: string;
}

export interface SkillSpec {
  id: string;
  name: string;
  category: 'Discord' | 'Brahma' | 'System';
  description: string;
  paramSpec: string;
  handler: (params: Record<string, any>, context: { userId: string; username: string; prompt: string }) => Promise<string>;
}

// Interface representing the mock state for the local simulator
interface MockState {
  channels: Array<{ id: string; name: string; type: string; topic?: string }>;
  roles: Array<{ id: string; name: string; color?: string }>;
  members: Array<{ id: string; username: string; roles: string[] }>;
  messages: Array<{ channelId: string; author: string; content: string; timestamp: Date }>;
}

export class DiscordService {
  private static client: Client | null = null;
  private static chatHistories = new Map<string, LLMMessage[]>();
  
  // Master Capability Skills Registry Map (Dynamic Hunar Engine Interface)
  private static skills = new Map<string, SkillSpec>();

  private static skillHandlers = new Map<string, (params: Record<string, any>, context: { userId: string; username: string; prompt: string }) => Promise<string>>([
    ['CREATE_CHANNEL', async (p) => DiscordService.execCreateChannel(p.name, p.type || 'text', p.topic)],
    ['DELETE_CHANNEL', async (p) => DiscordService.execDeleteChannel(p.identifier)],
    ['CREATE_ROLE', async (p) => DiscordService.execCreateRole(p.name, p.color)],
    ['DELETE_ROLE', async (p) => DiscordService.execDeleteRole(p.identifier)],
    ['ASSIGN_ROLE', async (p) => DiscordService.execAssignRole(p.usernameOrId, p.roleNameOrId)],
    ['REMOVE_ROLE', async (p) => DiscordService.execRemoveRole(p.usernameOrId, p.roleNameOrId)],
    ['KICK_MEMBER', async (p) => DiscordService.execKickMember(p.usernameOrId, p.reason)],
    ['BAN_MEMBER', async (p) => DiscordService.execBanMember(p.usernameOrId, p.reason)],
    ['SEND_MESSAGE', async (p) => DiscordService.execSendMessage(p.channelNameOrId, p.content)],
    ['LIST_CHANNELS', async () => DiscordService.execListChannels()],
    ['LIST_ROLES', async () => DiscordService.execListRoles()],
    ['LIST_MEMBERS', async () => DiscordService.execListMembers()],
    ['QUERY_RAG', async (p) => DiscordService.execQueryRAG(p.query)],
    ['DECOMPOSE_MISSION', async (p) => DiscordService.execDecomposeMission(p.title, p.objective)],
    ['EXECUTE_NEXT_TASK', async (p) => DiscordService.execExecuteNextTask(p.missionId)],
    ['COMPLETE_TASK', async (p) => DiscordService.execCompleteTask(p.missionId, p.subTaskId)],
    ['SYNC_BRAIN', async (p, ctx) => DiscordService.execSyncBrain(ctx.userId, ctx.username)],
    ['BRAHMA_CHAT', async (p, ctx) => DiscordService.execBrahmaChat(ctx.prompt, ctx.userId)],
    ['CREATE_SKILL', async (p) => DiscordService.execCreateSkillAction(p.name, p.description, p.category, p.paramSpec, p.triggers)],
    ['READ_EMAILS', async (p) => GmailService.readEmails(p.maxResults, p.query)],
    ['SEND_EMAIL', async (p) => GmailService.sendEmail(p.to, p.subject, p.body)],
    ['SCHEDULE_CRON', async (p) => {
      const { CronService } = await import('./cron.service');
      const newJob = await CronService.addJob(p.name, p.cronExpression, p.prompt, p.durationSec);
      return `⏰ **Cron Job Scheduled**: ${newJob.name} (${newJob.jobId}) to run at \`${newJob.cronExpression}\`${p.durationSec ? ` for ${p.durationSec} seconds` : ''}`;
    }],
  ]);

  public static loadSkillsFromDisk(): void {
    const brainDir = path.join(__dirname, '../Brahma [Brain]');
    const skillsDir = path.join(brainDir, 'skills');
    this.skills.clear();

    const scanDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          if (entry.name === 'template.md' || entry.name === 'README.md') continue;
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const yamlMatch = content.match(/```yaml([\s\S]*?)```/);
            if (yamlMatch) {
              const yamlStr = yamlMatch[1];
              const parsed = this.parseYaml(yamlStr);
              if (parsed.id && parsed.name) {
                const handler = this.skillHandlers.get(parsed.name) || (async () => `❌ Handler for skill ${parsed.name} not implemented.`);
                this.skills.set(parsed.id, {
                  id: parsed.id,
                  name: parsed.name,
                  category: (parsed.category || 'System') as any,
                  description: parsed.description || '',
                  paramSpec: parsed.paramSpec || '{}',
                  handler
                });
              }
            }
          } catch (err: any) {
            console.error(`⚠️ Failed to parse skill sheet ${entry.name}:`, err.message);
          }
        }
      }
    };

    scanDir(skillsDir);
    console.log(`🔍 Dynamic Skill Registry: Loaded ${this.skills.size} Hunar skill sheets from disk.`);
  }

  private static parseYaml(yamlStr: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = yamlStr.split('\n');
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
    return result;
  }

  private static mockState: MockState = {
    channels: [
      { id: 'c-1', name: 'general', type: 'text' },
      { id: 'c-2', name: 'announcements', type: 'text', topic: 'Important Updates' },
      { id: 'c-3', name: 'lobby', type: 'voice' },
    ],
    roles: [
      { id: 'r-1', name: '@everyone' },
      { id: 'r-2', name: 'Admin', color: '#ff0000' },
      { id: 'r-3', name: 'Dev', color: '#00ff00' },
    ],
    members: [
      { id: 'm-1', username: 'anubhav', roles: ['r-1', 'r-3'] },
      { id: 'm-2', username: 'Spammer', roles: ['r-1'] },
      { id: 'm-3', username: 'Yuvraj', roles: ['r-1', 'r-2'] },
    ],
    messages: [],
  };

  public static get isLive(): boolean {
    return !!process.env.DISCORD_BOT_TOKEN;
  }

  /**
   * Initializes and connects the Discord Bot.
   * If DISCORD_BOT_TOKEN is missing, it falls back gracefully to Mock/Simulator mode.
   */
  public static async connect(): Promise<DiscordServiceStatus> {
    this.loadSkillsFromDisk();
    if (!this.isLive) {
      console.log('🤖 Discord Bot: DISCORD_BOT_TOKEN not set. Running in MOCK/SIMULATION Mode.');
      return { connected: true, mode: 'mock' };
    }

    try {
      console.log('🔌 Connecting to Discord Live Gateway...');
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMembers,
        ],
      });

      return new Promise((resolve) => {
        this.client!.once('ready', async () => {
          console.log(`🤖 Discord Bot connected live as: ${this.client!.user?.tag}`);

          // Register message listener - Automatically active on any channel message!
          this.client!.on('messageCreate', async (message) => {
            if (message.author.bot) return;

            let cleanPrompt = message.content;
            const hasPrefix = message.content.startsWith('!brahma');
            const isMentioned = message.mentions.has(this.client!.user!);

            if (!hasPrefix && !isMentioned) return;

            if (hasPrefix) {
              cleanPrompt = message.content.slice(7).trim();
            } else if (isMentioned) {
              cleanPrompt = message.content.replace(/<@!?\d+>/g, '').trim();
            }

            if (!cleanPrompt) return; // Ignore empty message strings

            try {
              await message.channel.sendTyping();
              const response = await this.handleUserCommand(cleanPrompt, message.author.id, message.author.username, message.guildId || 'dm');
              
              let targetChannel = message.channel;
              const preferredChannelName = DiscordService.getPreferredChannelFromMatrix();
              if (preferredChannelName && message.guild) {
                const isSummaryOrSync = response.includes('Session Memory Log') || 
                                        response.includes('Brahma Long-Term Memory Synced!') ||
                                        cleanPrompt.toLowerCase().includes('sync') ||
                                        cleanPrompt.toLowerCase().includes('summarize');
                if (isSummaryOrSync) {
                  const cleanPref = preferredChannelName.toLowerCase().replace(/\s+/g, '-');
                  const routedChannel = message.guild.channels.cache.find(
                    (c) => c.name.toLowerCase() === cleanPref ||
                           c.name.toLowerCase().replace(/-/g, ' ') === preferredChannelName.toLowerCase()
                  );
                  if (routedChannel && routedChannel.type === ChannelType.GuildText) {
                    targetChannel = routedChannel as any;
                  }
                }
              }

              if (targetChannel.id === message.channel.id) {
                await message.reply(response);
              } else {
                await (targetChannel as any).send(`<@${message.author.id}>, here is the response to your request:\n\n${response}`);
              }
            } catch (err: any) {
              await message.reply(`❌ Error executing instruction: ${err.message}`);
            }
          });

          resolve({
            connected: true,
            mode: 'live',
            guildName: 'Active Discord Sessions',
          });
        });

        this.client!.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
          console.warn('⚠️ Live Discord Login Failed:', err.message);
          console.warn('🔄 Falling back gracefully to MOCK/SIMULATION Mode.');
          this.client = null;
          resolve({ connected: true, mode: 'mock' });
        });
      });
    } catch (err: any) {
      console.warn('⚠️ Failed to initialize Discord Client:', err.message);
      this.client = null;
      return { connected: true, mode: 'mock' };
    }
  }

  public static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      console.log('🔌 Discord Bot disconnected successfully.');
    }
  }

  public static getStatus(): DiscordServiceStatus {
    if (this.client?.readyAt) {
      return {
        connected: true,
        mode: 'live',
        guildName: this.client.guilds.cache.first()?.name,
        guildId: this.client.guilds.cache.first()?.id,
      };
    }
    return {
      connected: this.isLive ? false : true,
      mode: this.isLive ? 'live' : 'mock',
    };
  }

  /**
   * Translates a natural language command into structured action, executes it dynamically using Hunar Skill Registry.
   */
  public static async handleUserCommand(
    prompt: string,
    userId: string,
    username: string,
    contextId: string
  ): Promise<string> {
    console.log(`💬 Processing Natural Language Input: "${prompt}" from ${username} (${userId})`);

    // Safety hydration in case connect was bypassed
    if (this.skills.size === 0) {
      this.loadSkillsFromDisk();
    }

    // Dynamically compile intent schema from live registry to avoid hardcoding!
    const skillList = Array.from(this.skills.values())
      .map((s, i) => `${i + 1}. Skill ID: \`${s.id}\` | Action: **${s.name}** | Category: *${s.category}*\n   Description: ${s.description}\n   Params: \`${s.paramSpec}\``)
      .join('\n\n');

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are Brahma Discord Orchestrator, an AI with administrative access to the Discord guild and direct integration with Brahma services.
Decompose the user's message into EXACTLY one of the registered actions listed below, providing the required arguments.
Respond in STRICT JSON conforming to the schema:
{
  "action": "string" (Must match EXACTLY one of the registered Actions below),
  "params": { ... }
}

### Intent Decision Rules:
Use the Dynamic Skill Registry below to match the user's intent. The action string MUST EXACTLY MATCH one of the Skill 'Action' names.
If the user's request does not clearly match any of the registered skills, fall back to the generic "BRAHMA_CHAT" action to respond conversationally.

### Dynamic Skill Registry:
${skillList}`
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    let actionResponse: DiscordAction;
    try {
      actionResponse = await LLMService.queryStructured<DiscordAction>(messages);
    } catch (err: any) {
      console.warn('⚠️ Structured parser failed, falling back to BRAHMA_CHAT:', err.message);
      actionResponse = { action: 'BRAHMA_CHAT', params: { message: prompt } };
    }

    console.log(`🧠 Decoded Action: ${actionResponse.action}`, actionResponse.params);

    // Look up and execute the skill dynamically from the registry!
    const skill = Array.from(this.skills.values()).find(
      (s) => s.name === actionResponse.action
    );

    try {
      if (skill) {
        return await skill.handler(actionResponse.params || {}, { userId, username, prompt });
      } else {
        // Fallback to conversational chat if action is unknown or not mapped
        return await this.execBrahmaChat(prompt, userId);
      }
    } catch (err: any) {
      console.error(`❌ Dynamic Execution Failed for ${actionResponse.action}:`, err);
      return `❌ Action ${actionResponse.action} failed: ${err.message}`;
    }
  }

  // ==========================================
  // Action Implementation Methods
  // ==========================================

  private static async execCreateChannel(name: string, type: string, topic?: string): Promise<string> {
    const cleanName = name.toLowerCase().replace(/\s+/g, '-');
    if (this.client?.readyAt) {
      const guild = this.client.guilds.cache.first();
      if (!guild) throw new Error('No active Guild loaded.');
      const channelType = type === 'voice' ? ChannelType.GuildVoice : type === 'category' ? ChannelType.GuildCategory : ChannelType.GuildText;
      const channel = await guild.channels.create({
        name: cleanName,
        type: channelType,
        topic: topic,
      });
      return `🛠️ **Live Action Executed**: Created new channel <#${channel.id}> (Type: ${type}).`;
    } else {
      // Mock mode
      const newId = `c-${Date.now().toString().slice(-4)}`;
      this.mockState.channels.push({ id: newId, name: cleanName, type, topic });
      return `🛠️ **Mock Action Executed**: Channel \`#${cleanName}\` (Type: ${type}) successfully created. (ID: ${newId})`;
    }
  }

  private static async execDeleteChannel(identifier: string): Promise<string> {
    if (this.client?.readyAt) {
      const guild = this.client.guilds.cache.first();
      if (!guild) throw new Error('No active Guild loaded.');
      const channel = guild.channels.cache.find((c) => c.id === identifier || c.name.toLowerCase() === identifier.toLowerCase());
      if (!channel) throw new Error(`Channel "${identifier}" not found.`);
      await channel.delete();
      return `🗑️ **Live Action Executed**: Channel \`#${channel.name}\` has been deleted.`;
    } else {
      const index = this.mockState.channels.findIndex((c) => c.id === identifier || c.name.toLowerCase() === identifier.toLowerCase());
      if (index === -1) throw new Error(`Channel "${identifier}" not found in mock state.`);
      const name = this.mockState.channels[index].name;
      this.mockState.channels.splice(index, 1);
      return `🗑️ **Mock Action Executed**: Channel \`#${name}\` successfully deleted.`;
    }
  }

  private static async execCreateRole(name: string, color?: string): Promise<string> {
    if (this.client?.readyAt) {
      const guild = this.client.guilds.cache.first();
      if (!guild) throw new Error('No active Guild loaded.');
      const role = await guild.roles.create({
        name,
        color: (color as any) || undefined,
        reason: 'Brahma bot auto-role creation',
      });
      return `🛡️ **Live Action Executed**: Role **${role.name}** successfully created (ID: ${role.id}).`;
    } else {
      const newId = `r-${Date.now().toString().slice(-4)}`;
      this.mockState.roles.push({ id: newId, name, color });
      return `🛡️ **Mock Action Executed**: Role **${name}** (Color: ${color || 'Default'}) successfully created. (ID: ${newId})`;
    }
  }

  private static async execDeleteRole(identifier: string): Promise<string> {
    if (this.client?.readyAt) {
      const guild = this.client.guilds.cache.first();
      if (!guild) throw new Error('No active Guild loaded.');
      const role = guild.roles.cache.find((r) => r.id === identifier || r.name.toLowerCase() === identifier.toLowerCase());
      if (!role) throw new Error(`Role "${identifier}" not found.`);
      await role.delete();
      return `🗑️ **Live Action Executed**: Role **${role.name}** has been deleted.`;
    } else {
      const index = this.mockState.roles.findIndex((r) => r.id === identifier || r.name.toLowerCase() === identifier.toLowerCase());
      if (index === -1) throw new Error(`Role "${identifier}" not found in mock state.`);
      const name = this.mockState.roles[index].name;
      this.mockState.roles.splice(index, 1);
      return `🗑️ **Mock Action Executed**: Role **${name}** successfully deleted.`;
    }
  }

  private static async execAssignRole(usernameOrId: string, roleNameOrId: string): Promise<string> {
    if (this.client?.readyAt) {
      const guild = this.client.guilds.cache.first();
      if (!guild) throw new Error('No active Guild loaded.');
      // find role
      const role = guild.roles.cache.find((r) => r.id === roleNameOrId || r.name.toLowerCase() === roleNameOrId.toLowerCase());
      if (!role) throw new Error(`Role "${roleNameOrId}" not found.`);
      // find member
      const member = guild.members.cache.find((m) => m.id === usernameOrId || m.user.username.toLowerCase() === usernameOrId.toLowerCase());
      if (!member) throw new Error(`Member "${usernameOrId}" not found in cache.`);
      await member.roles.add(role);
      return `✅ **Live Action Executed**: Role **${role.name}** assigned to @${member.user.username}.`;
    } else {
      const member = this.mockState.members.find((m) => m.id === usernameOrId || m.username.toLowerCase() === usernameOrId.toLowerCase());
      if (!member) throw new Error(`Member "${usernameOrId}" not found.`);
      const role = this.mockState.roles.find((r) => r.id === roleNameOrId || r.name.toLowerCase() === roleNameOrId.toLowerCase());
      if (!role) throw new Error(`Role "${roleNameOrId}" not found.`);
      if (member.roles.includes(role.id)) return `ℹ️ Member @${member.username} already has role **${role.name}**.`;
      member.roles.push(role.id);
      return `✅ **Mock Action Executed**: Role **${role.name}** assigned to @${member.username}.`;
    }
  }

  private static async execRemoveRole(usernameOrId: string, roleNameOrId: string): Promise<string> {
    if (this.client?.readyAt) {
      const guild = this.client.guilds.cache.first();
      if (!guild) throw new Error('No active Guild loaded.');
      const role = guild.roles.cache.find((r) => r.id === roleNameOrId || r.name.toLowerCase() === roleNameOrId.toLowerCase());
      if (!role) throw new Error(`Role "${roleNameOrId}" not found.`);
      const member = guild.members.cache.find((m) => m.id === usernameOrId || m.user.username.toLowerCase() === usernameOrId.toLowerCase());
      if (!member) throw new Error(`Member "${usernameOrId}" not found.`);
      await member.roles.remove(role);
      return `✅ **Live Action Executed**: Role **${role.name}** removed from @${member.user.username}.`;
    } else {
      const member = this.mockState.members.find((m) => m.id === usernameOrId || m.username.toLowerCase() === usernameOrId.toLowerCase());
      if (!member) throw new Error(`Member "${usernameOrId}" not found.`);
      const role = this.mockState.roles.find((r) => r.id === roleNameOrId || r.name.toLowerCase() === roleNameOrId.toLowerCase());
      if (!role) throw new Error(`Role "${roleNameOrId}" not found.`);
      const index = member.roles.indexOf(role.id);
      if (index === -1) return `ℹ️ Member @${member.username} does not have role **${role.name}**.`;
      member.roles.splice(index, 1);
      return `✅ **Mock Action Executed**: Role **${role.name}** removed from @${member.username}.`;
    }
  }

  private static async execKickMember(usernameOrId: string, reason?: string): Promise<string> {
    if (this.client?.readyAt) {
      const guild = this.client.guilds.cache.first();
      if (!guild) throw new Error('No active Guild loaded.');
      const member = guild.members.cache.find((m) => m.id === usernameOrId || m.user.username.toLowerCase() === usernameOrId.toLowerCase());
      if (!member) throw new Error(`Member "${usernameOrId}" not found.`);
      await member.kick(reason);
      return `🥾 **Live Action Executed**: Member @${member.user.username} was kicked. Reason: ${reason || 'None provided'}`;
    } else {
      const index = this.mockState.members.findIndex((m) => m.id === usernameOrId || m.username.toLowerCase() === usernameOrId.toLowerCase());
      if (index === -1) throw new Error(`Member "${usernameOrId}" not found.`);
      const username = this.mockState.members[index].username;
      this.mockState.members.splice(index, 1);
      return `🥾 **Mock Action Executed**: Member @${username} was kicked. Reason: ${reason || 'None provided'}`;
    }
  }

  private static async execBanMember(usernameOrId: string, reason?: string): Promise<string> {
    if (this.client?.readyAt) {
      const guild = this.client.guilds.cache.first();
      if (!guild) throw new Error('No active Guild loaded.');
      const member = guild.members.cache.find((m) => m.id === usernameOrId || m.user.username.toLowerCase() === usernameOrId.toLowerCase());
      if (!member) throw new Error(`Member "${usernameOrId}" not found.`);
      await member.ban({ reason });
      return `🔨 **Live Action Executed**: Member @${member.user.username} was banned. Reason: ${reason || 'None provided'}`;
    } else {
      const index = this.mockState.members.findIndex((m) => m.id === usernameOrId || m.username.toLowerCase() === usernameOrId.toLowerCase());
      if (index === -1) throw new Error(`Member "${usernameOrId}" not found.`);
      const username = this.mockState.members[index].username;
      this.mockState.members.splice(index, 1);
      return `🔨 **Mock Action Executed**: Member @${username} was permanently banned. Reason: ${reason || 'None provided'}`;
    }
  }

  private static async execSendMessage(channelNameOrId: string, content: string): Promise<string> {
    if (this.client?.readyAt) {
      const guild = this.client.guilds.cache.first();
      if (!guild) throw new Error('No active Guild loaded.');
      
      let channel = guild.channels.cache.find(
        (c) => c.id === channelNameOrId || 
               c.name.toLowerCase() === channelNameOrId.toLowerCase() ||
               c.name.toLowerCase().replace(/-/g, '') === channelNameOrId.toLowerCase().replace(/-/g, '')
      );

      let wasCreated = false;
      if (!channel) {
        console.log(`📢 Text channel "${channelNameOrId}" not found. Creating it dynamically...`);
        const cleanName = channelNameOrId.toLowerCase().replace(/\s+/g, '-');
        channel = await guild.channels.create({
          name: cleanName,
          type: ChannelType.GuildText,
        }) as any;
        wasCreated = true;
      }

      if (!channel) {
        throw new Error(`Failed to find or create channel "${channelNameOrId}".`);
      }

      if (channel.type !== ChannelType.GuildText) {
        throw new Error(`Channel "${channelNameOrId}" exists but is not a text channel.`);
      }

      await (channel as any).send(content);
      return wasCreated
        ? `✉️ **Live Action Executed**: Created missing text channel <#${channel.id}> and sent message: "${content}"`
        : `✉️ **Live Action Executed**: Sent message to <#${channel.id}>: "${content}"`;
    } else {
      let channel = this.mockState.channels.find(
        (c) => c.id === channelNameOrId || 
               c.name.toLowerCase() === channelNameOrId.toLowerCase() ||
               c.name.toLowerCase().replace(/-/g, '') === channelNameOrId.toLowerCase().replace(/-/g, '')
      );

      let wasCreated = false;
      if (!channel) {
        const mockId = `c-${Date.now().toString().slice(-4)}`;
        const cleanName = channelNameOrId.toLowerCase().replace(/\s+/g, '-');
        const newChan = { id: mockId, name: cleanName, type: 'text' };
        this.mockState.channels.push(newChan);
        channel = newChan;
        wasCreated = true;
      }

      this.mockState.messages.push({
        channelId: channel.id,
        author: 'BrahmaBot',
        content,
        timestamp: new Date(),
      });

      return wasCreated
        ? `✉️ **Mock Action Executed**: Created missing text channel \`#${channel.name}\` dynamically and sent message: "${content}"`
        : `✉️ **Mock Action Executed**: Sent message to \`#${channel.name}\`: "${content}"`;
    }
  }

  private static async execQueryRAG(query: string): Promise<string> {
    console.log(`🔍 Executing Brahma RAG Context Retrieval for query: "${query}"`);
    const ragResult = await RAGService.run(query);
    return [
      `🔍 **Brahma RAG Context Retrieval Results**`,
      `*Query*: "${query}"`,
      `---`,
      ragResult.contextBlock.slice(0, 1500) + (ragResult.contextBlock.length > 1500 ? '\n*(truncated)*' : ''),
      `---`,
      `**Sources used:**`,
      ...ragResult.sources.map((s) => `- \`[${s.docType.toUpperCase()}]\` ${s.docId}`),
    ].join('\n');
  }

  private static async execDecomposeMission(title: string, objective: string): Promise<string> {
    console.log(`🧠 Decomposing mission: "${title}" via Discord bot request.`);
    const mission = await OrchestratorService.decomposeMission(title, objective);
    return [
      `🧠 **Brahma Strategic Decomposition Complete**`,
      `Mission Title: **${mission.title}** (ID: \`${mission.missionId}\`)`,
      `Objective: *${mission.objective}*`,
      `---`,
      `**Sub-Tasks Created:**`,
      ...mission.subTasks.map((t: import('../models/Dharma').ISubTask) => `- \`[${t.subTaskId}]\` **${t.title}** — Assigned to: *${t.assignedTo}* (${t.status})`),
      `---`,
      `Use \`execute task ${mission.missionId}\` to launch execution!`,
    ].join('\n');
  }

  private static async execExecuteNextTask(missionId: string): Promise<string> {
    console.log(`🚀 Activating next sub-task for mission: ${missionId}`);
    const nextTask = await OrchestratorService.executeNextTask(missionId);
    if (!nextTask) {
      return `🏁 **Mission Complete**: All tasks for mission \`${missionId}\` are already completed!`;
    }
    return [
      `🚀 **Sub-Task Activated!**`,
      `Mission ID: \`${missionId}\``,
      `Task ID: \`${nextTask.subTaskId}\``,
      `Title: **${nextTask.title}**`,
      `Description: *${nextTask.description}*`,
      `Status: **IN_PROGRESS**`,
    ].join('\n');
  }

  private static async execCompleteTask(missionId: string, subTaskId: string): Promise<string> {
    console.log(`✅ Completing task: ${subTaskId} under mission: ${missionId}`);
    await OrchestratorService.completeTask(missionId, subTaskId);
    const mission = await Dharma.findOne({ missionId });
    const progress = mission ? mission.overallProgress : 100;
    return `✅ **Task Completed**: Sub-task \`${subTaskId}\` marked completed. Mission \`${missionId}\` overall progress is now **${progress}%**.`;
  }

  private static getAtmanContext(): string {
    try {
      const brainDir = path.join(__dirname, '../Brahma [Brain]');
      const atmanPath = path.join(brainDir, 'Atman.md');
      if (fs.existsSync(atmanPath)) {
        return fs.readFileSync(atmanPath, 'utf-8');
      }
    } catch (err: any) {
      console.warn('⚠️ Failed to load Atman.md context:', err.message);
    }
    return 'Personality Engine Matrix: Default settings active.';
  }

  private static async execBrahmaChat(message: string, userId?: string): Promise<string> {
    const key = userId || 'default';
    let history = this.chatHistories.get(key) || [];

    // Append new user message
    history.push({ role: 'user', content: message });

    // Keep history at a maximum of 12 messages to prevent token bloat
    if (history.length > 12) {
      history = history.slice(-12);
    }

    const atmanContext = this.getAtmanContext();

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are Brahma, the supreme intelligence agent. Provide a helpful, intelligent, and rich conversational response to the user.

Use the Atman Personality matrix guidelines and the observed User Adaptive Alignment Matrix preferences below to shape your behavioral sliders, vocabulary traits, stoic/vedic philosophy, and user details (like their name or coding styles):

${atmanContext}`
      },
      ...history
    ];

    const reply = await LLMService.query(messages);

    // Save assistant reply to history
    history.push({ role: 'assistant', content: reply });
    this.chatHistories.set(key, history);

    // Launch autonomous background reflection and persistence asynchronously
    this.runAutonomousReflection(key, message, reply).catch((err) => {
      console.error('⚠️ Autonomous background reflection failed:', err.message);
    });

    return reply;
  }

  private static async execSyncBrain(userId: string, username: string): Promise<string> {
    console.log(`🧠 Syncing Brain for user: ${username} (${userId})`);
    const history = this.chatHistories.get(userId) || [];

    if (history.length === 0) {
      return `ℹ️ No conversation history found for @${username}. Chat with me first!`;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const contextLines = history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are Buddhi, the cognitive integrator of Brahma.
Given the following conversation history between the user and Brahma, generate a high-density, beautifully formatted Markdown Session Memory Log.
Follow this EXACT format matching this template:
---
# Session Memory Log: ${dateStr}

\`\`\`yaml
session_id: C-${Date.now().toString().slice(-3)}
date: ${dateStr}
overall_outcome: SUCCESS
total_actions_archived: 3
last_state_checksum: "CONVERSATIONAL_SYNC"
agent_permission: READ-ONLY
description: "Conversational memory sync between ${username} and Brahma."
\`\`\`

---

## 1. High-Density Operations Summary

- **Summary Item 1**: Summarize a key topic or relationship detail discussed.
- **Summary Item 2**: Note another core highlight.

---

## 2. Chronological Action Register Archive

| Task Ref | Core Operation / Action Taken | Output Result | Impact Status |
| :--- | :--- | :--- | :---: |
| \`M-SYNC-01\` | User introduction and preference alignment. | Brahma registered user details. | **SUCCESS** |

---

## 3. Structural Modifications Log

* **[UPDATED]** [Zehn.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/Zehn.md) - Session registry updated.

---

## 4. Key Learnings & Behavioral Adjustments

* **Learning [L-SYNC-01]**: User expressed key alignment data.
* **Behavioral Change**: Slider parameters locked.
---

Generate ONLY the valid markdown content — do not wrap in additional markdown code blocks or explanations.`
      },
      {
        role: 'user',
        content: `Conversations:\n${contextLines}`
      }
    ];

    const memoryLogContent = await LLMService.query(messages);

    const brainDir = path.join(__dirname, '../Brahma [Brain]');
    const memoryDir = path.join(brainDir, 'memory');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }

    const memoryFilePath = path.join(memoryDir, `${dateStr}.md`);
    fs.writeFileSync(memoryFilePath, memoryLogContent, 'utf-8');
    console.log(`Persisted session log: ${memoryFilePath}`);

    const zehnPath = path.join(brainDir, 'Zehn.md');
    if (fs.existsSync(zehnPath)) {
      let zehnContent = fs.readFileSync(zehnPath, 'utf-8');
      const sessionRow = `| **${dateStr}** | \`C-${Date.now().toString().slice(-3)}\` | Conversational memory sync between ${username} and Brahma. | [${dateStr}.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/memory/${dateStr}.md) | LOW (~1.0k) |\n`;

      if (zehnContent.includes('<!-- DYNAMIC_SESSION_INSERTION_MARKER -->')) {
        zehnContent = zehnContent.replace(
          '<!-- DYNAMIC_SESSION_INSERTION_MARKER -->',
          `<!-- DYNAMIC_SESSION_INSERTION_MARKER -->\n${sessionRow}`
        );
        fs.writeFileSync(zehnPath, zehnContent, 'utf-8');
        console.log(`Zehn.md session log inserted.`);
        ContextService.syncEntitiesInZehn(brainDir, username);
      }
    }

    const stats = await import('./vector.service').then((m) => m.VectorService.indexAllBrainDocuments());

    return [
      `🧠 **Brahma Long-Term Memory Synced!**`,
      `I have saved our conversation to my permanent brain directory on disk!`,
      `---`,
      `* **Memory Log Saved**: [${dateStr}.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/memory/${dateStr}.md)`,
      `* **Registry Updated**: [Zehn.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/Zehn.md)`,
      `* **RAG Indexed**: Seeded successfully (${stats.indexed} new chunks, ${stats.skipped} skipped)`,
      `---`,
      `Now, if you ask me *"what is my name"* or *"what did we discuss"*, my RAG model will search these persistent files and answer perfectly!`
    ].join('\n');
  }

  private static async runAutonomousReflection(
    userId: string,
    userMessage: string,
    assistantReply: string
  ): Promise<void> {
    const cleanMsg = userMessage.trim().toLowerCase();
    const casualGreetings = ['hello', 'hey', 'hi', 'yo', 'sup', 'howdy', 'test', 'status', 'ping', 'pong', 'ok', 'okay'];
    if (cleanMsg.length < 12 || casualGreetings.includes(cleanMsg)) {
      console.log('🧠 [Reflection Engine] Message too short or casual. Skipping reflection.');
      return;
    }

    console.log(`🧠 [Reflection Engine] Analyzing conversational turn for user: ${userId}`);

    // Query LLM to evaluate if we should sync/reflect
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are Chintan, the reflection engine of Brahma.
Analyze the user's message and the assistant's reply below. Decide if there is vital information that should be persistently written to Brahma's long-term memory.
We have two options for persistence:
1. UPDATE_PERSONALITY: Set this to true ONLY if the user shared new personal details, preferences, interests, codenames, rules, or direct alignment settings (e.g. "my name is yuvraj", "I prefer concise code", "silently write files in the background").
2. ARCHIVE_MEMORY: Set this to true ONLY if they completed a major structural milestone, finished a conversation session, synced the brain, or shared information that should be indexed in RAG long term.

Respond in STRICT JSON conforming to the schema:
{
  "updatePersonality": boolean,
  "archiveMemory": boolean,
  "observedPreference": "string" (if updatePersonality is true, summarize the observation, e.g. "User's name is Yuvraj Mishra."),
  "adaptationRequired": "string" (if updatePersonality is true, summarize how Brahma must adapt, e.g. "Always address the user as Yuvraj and customize alignment.")
}`
      },
      {
        role: 'user',
        content: `User: "${userMessage}"\nAssistant: "${assistantReply}"`
      }
    ];

    let decision;
    try {
      decision = await LLMService.queryStructured<{
        updatePersonality: boolean;
        archiveMemory: boolean;
        observedPreference?: string;
        adaptationRequired?: string;
      }>(messages, { isAuxiliary: true });
    } catch {
      return; // Fail silently
    }

    console.log('🧠 [Reflection Engine] Decision:', decision);

    const brainDir = path.join(__dirname, '../Brahma [Brain]');

    // Option A: Update Atman.md
    if (decision.updatePersonality && decision.observedPreference && decision.adaptationRequired) {
      console.log('🧠 [Reflection Engine] Updating personality preferences in Atman.md...');
      const atmanPath = path.join(brainDir, 'Atman.md');
      if (fs.existsSync(atmanPath)) {
        let content = fs.readFileSync(atmanPath, 'utf-8');

        // Deduplication check: skip if this preference or key details already exist in Atman matrix
        const lowerObserved = decision.observedPreference.toLowerCase();
        const lowerAdapt = decision.adaptationRequired.toLowerCase();
        let isDuplicate = false;
        const matrixLines = content.split('\n');
        for (const line of matrixLines) {
          if (line.includes('U-PREF-')) {
            const parts = line.split('|');
            if (parts.length >= 4) {
              const existingObs = parts[2].trim().toLowerCase();
              const existingAdapt = parts[3].trim().toLowerCase();
              if (
                existingObs.includes(lowerObserved) ||
                lowerObserved.includes(existingObs) ||
                (existingObs.includes('yuvraj') && lowerObserved.includes('yuvraj')) ||
                (existingObs.includes('email summaries') && lowerObserved.includes('email summaries'))
              ) {
                isDuplicate = true;
                break;
              }
            }
          }
        }

        if (isDuplicate) {
          console.log('🧠 [Reflection Engine] Preference already captured in Atman.md. Skipping duplicate update.');
          return;
        }

        // Extract current version
        const versionMatch = content.match(/version: (\d+\.\d+\.\d+)/);
        let newVersion = '1.0.1';
        if (versionMatch) {
          const parts = versionMatch[1].split('.').map(Number);
          parts[2] += 1; // Increment patch
          newVersion = parts.join('.');
          content = content.replace(/version: \d+\.\d+\.\d+/, `version: ${newVersion}`);
        }

        // Update lastSync timestamp
        const nowIso = new Date().toISOString().slice(0, 19).replace('T', ' ') + '+05:30';
        content = content.replace(/last_sync: .*/, `last_sync: ${nowIso}`);

        // Find the last U-PREF-XXX to increment
        const prefMatches = Array.from(content.matchAll(/U-PREF-(\d+)/g));
        let nextNum = 1;
        if (prefMatches.length > 0) {
          const nums = prefMatches.map((m) => parseInt(m[1], 10));
          nextNum = Math.max(...nums) + 1;
        }
        const newPrefId = `U-PREF-${String(nextNum).padStart(3, '0')}`;

        // Build new table row
        const newRow = `| **${newPrefId}** | ${decision.observedPreference} | ${decision.adaptationRequired} | \`90%\` |\n`;

        // Insert row right before '---' that ends the section or under the matrix
        const splitContent = content.split('## 4. Agent Protocol');
        if (splitContent.length === 2) {
          const lines = splitContent[0].split('\n');
          let lastRowIndex = -1;
          for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim().startsWith('|') && lines[i].includes('%')) {
              lastRowIndex = i;
              break;
            }
          }

          if (lastRowIndex !== -1) {
            lines.splice(lastRowIndex + 1, 0, newRow);
            content = lines.join('\n') + '## 4. Agent Protocol' + splitContent[1];
            fs.writeFileSync(atmanPath, content, 'utf-8');
            console.log(`🧠 [Reflection Engine] Successfully saved ${newPrefId} to Atman.md`);
          }
        }
      }
    }

    // Option B: Archive Memory Log (Zehn.md + new daily log)
    if (decision.archiveMemory) {
      console.log('🧠 [Reflection Engine] Archiving memory log silently...');
      await this.execSyncBrain(userId, 'AutonomousUser'); // run silently
    }
  }

  private static async execListChannels(): Promise<string> {
    if (this.client?.readyAt) {
      const guild = this.client.guilds.cache.first();
      if (!guild) throw new Error('No active Guild loaded.');
      const channels = guild.channels.cache
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
        .map((c) => {
          const typeStr = c.type === ChannelType.GuildText ? 'Text' : c.type === ChannelType.GuildVoice ? 'Voice' : c.type === ChannelType.GuildCategory ? 'Category' : 'Other';
          return `- <#${c.id}> (Type: **${typeStr}**, ID: \`${c.id}\`)`;
        });
      return [
        `📊 **Brahma Discord Channels List**`,
        `Server: **${guild.name}**`,
        `---`,
        ...channels,
      ].join('\n');
    } else {
      const channels = this.mockState.channels.map(
        (c) => `- \`#${c.name}\` (Type: **${c.type}**, ID: \`${c.id}\`)`
      );
      return [
        `📊 **Mock Discord Channels List**`,
        `---`,
        ...channels,
      ].join('\n');
    }
  }

  private static async execListRoles(): Promise<string> {
    if (this.client?.readyAt) {
      const guild = this.client.guilds.cache.first();
      if (!guild) throw new Error('No active Guild loaded.');
      const roles = guild.roles.cache
        .sort((a, b) => b.position - a.position)
        .map((r) => `- **${r.name}** (Color: \`${r.hexColor}\`, Members: ${r.members.size}, ID: \`${r.id}\`)`);
      return [
        `🛡️ **Brahma Discord Roles List**`,
        `Server: **${guild.name}**`,
        `---`,
        ...roles,
      ].join('\n');
    } else {
      const roles = this.mockState.roles.map(
        (r) => `- **${r.name}** (Color: \`${r.color || 'Default'}\`, ID: \`${r.id}\`)`
      );
      return [
        `🛡️ **Mock Discord Roles List**`,
        `---`,
        ...roles,
      ].join('\n');
    }
  }

  private static async execListMembers(): Promise<string> {
    if (this.client?.readyAt) {
      const guild = this.client.guilds.cache.first();
      if (!guild) throw new Error('No active Guild loaded.');
      // Fetch members if not fully cached
      await guild.members.fetch();
      const members = guild.members.cache.map((m) => {
        const topRole = m.roles.highest.name;
        return `- **${m.user.tag}** (Top Role: *${topRole}*, Status: ${m.presence?.status || 'offline'})`;
      });
      return [
        `👥 **Brahma Discord Server Members**`,
        `Server: **${guild.name}**`,
        `---`,
        ...members,
      ].join('\n');
    } else {
      const members = this.mockState.members.map((m) => {
        const rolesList = m.roles
          .map((rId) => this.mockState.roles.find((r) => r.id === rId)?.name || rId)
          .join(', ');
        return `- **@${m.username}** (Roles: *${rolesList}*, ID: \`${m.id}\`)`;
      });
      return [
        `👥 **Mock Discord Server Members**`,
        `---`,
        ...members,
      ].join('\n');
    }
  }

  private static getPreferredChannelFromMatrix(): string | null {
    try {
      const atmanContext = this.getAtmanContext();
      const lines = atmanContext.split('\n');
      for (const line of lines) {
        if (line.includes('U-PREF-')) {
          const match = line.match(/(?:in the|to the)\s+([a-zA-Z0-9\s-_]+)\s+channel/i);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
      }
    } catch (err: any) {
      console.warn('⚠️ Failed to extract preferred channel from matrix:', err.message);
    }
    return null;
  }

  private static async execCreateSkillAction(
    name: string,
    description: string,
    category: string = 'Custom',
    paramSpec: string = '{"input":"string"}',
    triggers: string = 'create, skill'
  ): Promise<string> {
    const brainDir = path.join(__dirname, '../Brahma [Brain]');
    const result = ContextService.execCreateSkill(
      brainDir,
      name,
      description || `Executes the ${name} capability.`,
      category,
      paramSpec,
      triggers,
      () => this.loadSkillsFromDisk()
    );
    return [
      `🛠️ **Skill Created & Registered!**`,
      `---`,
      `* **Skill ID**: \`${result.skillId}\``,
      `* **Action Name**: \`${name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')}\``,
      `* **Category**: ${category}`,
      `* **File**: [${result.fileName}](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/brahma/${result.fileName})`,
      `* **Hunar.md**: Updated — \`registered_skills_count\` incremented.`,
      `---`,
      `The skill is now **live** in the registry. Brahma will use it on the next invocation.`,
    ].join('\n');
  }

  public static getMockState() {
    return this.mockState;
  }
}
