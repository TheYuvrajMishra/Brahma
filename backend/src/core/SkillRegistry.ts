import { ISkill } from '../types/Skill';
import { Logger } from './Logger';
import { SecurityGuard } from './SecurityGuard';
import { WebSearch } from '../skills/WebSearch';
import { LlmCall } from '../skills/LlmCall';
import { WriteBlog, WriteEmail } from '../skills/Writers';
import { SendEmail } from '../skills/SendEmail';
import { GetEmails } from '../skills/GetEmails';
import { DiscordReply } from '../skills/DiscordReply';
import { DiscordCreateChannel } from '../skills/DiscordCreateChannel';
import { SetPersona } from '../skills/SetPersona';
import {
    CreateSpreadsheet,
    FindSpreadsheet,
    ReadSpreadsheet,
    WriteSpreadsheet,
    AppendSpreadsheet,
    BatchUpdateSpreadsheet,
    AddCheckboxes,
    RemoveCheckboxes,
    ReplaceBanding
} from '../skills/GoogleSheets';
import { ConvertDocumentToMarkdown } from '../skills/ConvertDocument';

class SkillRegistryClass {
    private skills: Map<string, ISkill> = new Map();

    register(skill: ISkill) {
        this.skills.set(skill.name, skill);
        Logger.info('SkillRegistry', 'system', 0, `Registered skill: ${skill.name}`);
    }

    async runSkill(toolName: string, params: any): Promise<string> {
        const securityCheck = SecurityGuard.validateToolCall(toolName, params);
        if (!securityCheck.isSafe) {
            Logger.audit('TOOL_SECURITY_BLOCKED', { tool: toolName, reason: securityCheck.reason });
            throw new Error(securityCheck.reason || 'Security Violation: Tool execution blocked by Zero-Deletion & Privacy Shield.');
        }

        const skill = this.skills.get(toolName);
        if (!skill) {
            throw new Error(`Skill not found: ${toolName}`);
        }
        return await skill.execute(params);
    }
}

export const SkillRegistry = new SkillRegistryClass();

// Auto-register default skills
SkillRegistry.register(new WebSearch());
SkillRegistry.register(new LlmCall());
SkillRegistry.register(new WriteBlog());
SkillRegistry.register(new WriteEmail());
SkillRegistry.register(new SendEmail());
SkillRegistry.register(new GetEmails());
SkillRegistry.register(new DiscordReply());
SkillRegistry.register(new DiscordCreateChannel());
SkillRegistry.register(new SetPersona());
SkillRegistry.register(new CreateSpreadsheet());
SkillRegistry.register(new FindSpreadsheet());
SkillRegistry.register(new ReadSpreadsheet());
SkillRegistry.register(new WriteSpreadsheet());
SkillRegistry.register(new AppendSpreadsheet());
SkillRegistry.register(new BatchUpdateSpreadsheet());
SkillRegistry.register(new AddCheckboxes());
SkillRegistry.register(new RemoveCheckboxes());
SkillRegistry.register(new ReplaceBanding());
SkillRegistry.register(new ConvertDocumentToMarkdown());

