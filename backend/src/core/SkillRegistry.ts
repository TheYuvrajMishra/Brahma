import { ISkill } from '../types/Skill';
import { Logger } from './Logger';
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
    AddCheckboxes
} from '../skills/GoogleSheets';

class SkillRegistryClass {
    private skills: Map<string, ISkill> = new Map();

    register(skill: ISkill) {
        this.skills.set(skill.name, skill);
        Logger.info('SkillRegistry', 'system', 0, `Registered skill: ${skill.name}`);
    }

    async runSkill(toolName: string, params: any): Promise<string> {
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

