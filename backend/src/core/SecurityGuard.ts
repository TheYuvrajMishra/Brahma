import { Logger } from './Logger';

export interface SecurityCheckResult {
    isSafe: boolean;
    reason?: string;
    violationType?: 'DELETION_ATTEMPT' | 'PRIVACY_BREACH' | 'UNAUTHORIZED_ACCESS';
}

export class SecurityGuard {
    private static readonly FORBIDDEN_DELETION_PATTERNS = [
        /\bdelete\b/i,
        /\bremove\b/i,
        /\btrash\b/i,
        /\bdestroy\b/i,
        /\bpurge\b/i,
        /\berase\b/i,
        /\bwipe\b/i,
        /\bdrop\b/i,
        /\bclear_all\b/i,
        /\bunlink\b/i,
        /\bhatao\b/i, // Hinglish for remove/delete
        /\bhata\b/i,
        /\bmitao\b/i  // Hinglish for erase/delete
    ];

    private static readonly FORBIDDEN_DELETION_TOOLS = [
        'delete', 'remove', 'trash', 'destroy', 'purge', 'erase', 'wipe', 'drop',
        'delete-email', 'delete_email', 'delete-file', 'delete_file', 'delete-sheet',
        'delete_sheet', 'delete-row', 'delete_row', 'clear-inbox', 'delete-user-data'
    ];

    public static readonly SECURITY_FOOTER = `\n\n---\n🔒 **Brahma Security Guarantee**: Zero-Deletion & Privacy Shield Active. Connected user accounts and data are 100% protected.`;

    /**
     * Checks whether an intended tool execution or parameters attempt data deletion or breach privacy.
     */
    static validateToolCall(toolName: string, params: any): SecurityCheckResult {
        const lowerTool = (toolName || '').toLowerCase().trim();

        // 1. Check if tool name itself is a deletion tool
        if (this.FORBIDDEN_DELETION_TOOLS.some(t => lowerTool === t || lowerTool.includes(t))) {
            Logger.audit('SECURITY_VIOLATION_BLOCKED', {
                tool: toolName,
                reason: 'Forbidden deletion tool execution attempt',
                status: 'blocked'
            });
            return {
                isSafe: false,
                violationType: 'DELETION_ATTEMPT',
                reason: `Security Enforcement Violation: Action/Tool '${toolName}' is blocked. Brahma Zero-Deletion policy permanently forbids deleting user emails, files, sheets, or database records.`
            };
        }

        // 2. Check parameters for explicit deletion intent or flags
        if (params && typeof params === 'object') {
            const paramsString = JSON.stringify(params).toLowerCase();
            const hasDeletionAction = params.action && typeof params.action === 'string' &&
                this.FORBIDDEN_DELETION_PATTERNS.some(pat => pat.test(params.action));
            
            const hasDeleteParam = params.delete === true || params.remove === true || params.purge === true || params.trash === true;

            if (hasDeletionAction || hasDeleteParam) {
                Logger.audit('SECURITY_VIOLATION_BLOCKED', {
                    tool: toolName,
                    params,
                    reason: 'Parameter requests data deletion',
                    status: 'blocked'
                });
                return {
                    isSafe: false,
                    violationType: 'DELETION_ATTEMPT',
                    reason: `Security Enforcement Violation: Destructive parameter detected for '${toolName}'. Brahma Zero-Deletion policy permanently forbids deleting user emails, files, or connected Google data.`
                };
            }
        }

        // 3. Privacy check: Ensure OAuth tokens or secrets are never exposed in parameters
        if (params) {
            const paramsStr = JSON.stringify(params);
            if (paramsStr.includes('encryptedAccessToken') || paramsStr.includes('encryptedRefreshToken') || paramsStr.includes('GMAIL_CLIENT_SECRET')) {
                return {
                    isSafe: false,
                    violationType: 'PRIVACY_BREACH',
                    reason: 'Security Enforcement Violation: Direct exposure of authentication credentials or secrets is strictly forbidden.'
                };
            }
        }

        return { isSafe: true };
    }

    /**
     * Inspects prompt text to check if user or prompt injection is requesting data deletion.
     */
    static inspectPromptIntent(prompt: string): SecurityCheckResult {
        const lowerPrompt = (prompt || '').toLowerCase();
        
        // Detect explicit request to delete emails, drive files, spreadsheets, or user data
        const isDeleteEmail = (lowerPrompt.includes('delete') || lowerPrompt.includes('remove') || lowerPrompt.includes('hata')) &&
                              (lowerPrompt.includes('email') || lowerPrompt.includes('mail') || lowerPrompt.includes('inbox') || lowerPrompt.includes('gmail'));
        
        const isDeleteDriveOrSheet = (lowerPrompt.includes('delete') || lowerPrompt.includes('remove') || lowerPrompt.includes('trash') || lowerPrompt.includes('hata')) &&
                                     (lowerPrompt.includes('file') || lowerPrompt.includes('sheet') || lowerPrompt.includes('drive') || lowerPrompt.includes('doc'));

        const isDeleteUserData = lowerPrompt.includes('delete my account') || lowerPrompt.includes('delete user') || lowerPrompt.includes('wipe data') || lowerPrompt.includes('purge data');

        if (isDeleteEmail || isDeleteDriveOrSheet || isDeleteUserData) {
            return {
                isSafe: false,
                violationType: 'DELETION_ATTEMPT',
                reason: 'Security Guard: Data deletion requests for connected Google accounts or user data are permanently disabled to protect user data and privacy.'
            };
        }

        return { isSafe: true };
    }

    /**
     * Attaches the mandatory security guarantee badge to the bottom of outgoing response content.
     */
    static appendSecurityFooter(content: string): string {
        if (!content) return this.SECURITY_FOOTER.trim();
        if (content.includes('🔒 **Brahma Security Guarantee**') || content.includes('🔒 **Brahma Security Shield**')) {
            return content;
        }
        return `${content}${this.SECURITY_FOOTER}`;
    }

    /**
     * Gets the standard security footer string.
     */
    static getSecurityFooter(): string {
        return this.SECURITY_FOOTER;
    }
}
