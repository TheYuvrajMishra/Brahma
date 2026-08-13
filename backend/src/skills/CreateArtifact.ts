import { ISkill } from '../types/Skill';
import { ArtifactEngine } from '../pipeline/ArtifactEngine';

export class CreateArtifact implements ISkill {
    name = 'create-artifact';
    description = 'Generates and persists a structured document artifact file (.json, .md, .pdf, .html, .css, .js, .docx, .xlsx) scoped to the active session and user.';

    async execute(params: any): Promise<string> {
        const title = params.title || 'Generated Artifact';
        const filename = params.filename || 'artifact.md';
        const fileType = params.file_type || params.fileType;
        const content = params.content || params._dependency_context || '';
        const userId = params.user_id || params.userId;
        const sessionId = params.session_id || params.sessionId;

        if (!userId || !sessionId) {
            return 'Failed to create artifact: Missing required user_id or session_id context.';
        }

        if (!content) {
            return 'Failed to create artifact: Content cannot be empty.';
        }

        try {
            const artifact = await ArtifactEngine.generateArtifact({
                userId,
                sessionId,
                messageId: params.message_id || params.messageId,
                title,
                filename,
                fileType,
                content
            });

            return `SUCCESS: Created artifact "${artifact.filename}" (ID: ${artifact.artifactId}, Type: ${artifact.fileType})`;
        } catch (err: any) {
            console.error('[CreateArtifact] Error generating artifact:', err);
            return `Failed to create artifact: ${err.message}`;
        }
    }
}
