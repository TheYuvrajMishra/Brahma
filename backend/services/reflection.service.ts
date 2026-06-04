import { LLMService, ChatMessage } from './llm.service';
import { MemoryService } from './memory.service';

export interface ReflectionUpdate {
    newEntities: { id: string; category: string; name: string; description: string; tags: string }[];
    newRelationships: { id: string; source: string; relation: string; target: string; strength: number }[];
    newFacts: { id: string; category: string; fact: string; confidence: number }[];
    toneObservation: string;
}

export class ReflectionService {
    /**
     * Chintan: Analyzes the interaction to extract permanent knowledge and tone improvements.
     */
    static async reflect(userQuery: string, assistantResponse: string) {
        const systemPrompt = `
You are Chintan, the Reflection engine for Brahma.
Analyze the conversation and identify if any PERMANENT information was shared.
Examples: User's name, their girlfriend's name, their tech stack preferences, etc.

Return a JSON object:
{
    "newEntities": [{ "id": "E-XXX", "category": "Person", "name": "Name", "description": "...", "tags": "#..." }],
    "newRelationships": [{ "id": "R-XXX", "source": "E-000", "relation": "Dating", "target": "E-XXX", "strength": 10 }],
    "newFacts": [{ "id": "T-XXX", "category": "User", "fact": "...", "confidence": 10 }],
    "toneObservation": "Observation about user's preferred tone"
}

If nothing permanent was learned, return empty arrays.
Current Entity Count: Use E-100+ for new entities.
Current Relationship Count: Use R-100+ for new relationships.
Current Fact Count: Use T-100+ for new facts.
`;

        const messages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `User said: "${userQuery}"\nBrahma replied: "${assistantResponse}"` }
        ];

        try {
            const response = await LLMService.chat(messages, { json_mode: true });
            const update: ReflectionUpdate = JSON.parse(response);

            // Apply updates
            for (const entity of update.newEntities) {
                await MemoryService.updateEntity(entity.id, entity.category, entity.name, entity.description, entity.tags);
            }
            for (const rel of update.newRelationships) {
                await MemoryService.addRelationship(rel.id, rel.source, rel.relation, rel.target, rel.strength);
            }
            // Add Fact saving logic here if needed...

            console.log('Reflection complete. Brain evolved.');
        } catch (error) {
            console.error('Reflection Error:', error);
        }
    }
}
