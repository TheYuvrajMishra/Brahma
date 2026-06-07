import { NormalizedMessage } from '../types/Message';
import { LLMService } from '../services/LLMService';
import { MemoryManager } from '../core/MemoryManager';

export interface RouteResult {
    bucket: 'greeting' | 'simple' | 'complex';
    rule_matched: string;
    confidence_score: number;
    intent: 'casual_chat' | 'emotional_support' | 'email_request' | 'coding' | 'research' | 'command_execution' | 'spreadsheet_request' | 'other';
}

export class Router {
    /**
     * Phase 3: Hybrid Classifier
     */
    static async route(message: NormalizedMessage): Promise<RouteResult> {
        const text = message.content.trim().toLowerCase();

        // 1. Rules: Greetings (only if the message is purely a greeting)
        const greetingRegex = /^(hi|hello|hey|sup|what's up|greetings)(\s|$|[!?.,])/;
        if (greetingRegex.test(text)) {
            const cleanedText = text
                .replace(/^(hi|hello|hey|sup|what's up|greetings)/g, '')
                .replace(/\bbrahma\b/g, '')
                .replace(/[!?.,\s]/g, '')
                .trim();
            
            if (cleanedText.length === 0) {
                return {
                    bucket: 'greeting',
                    rule_matched: 'regex_greeting',
                    confidence_score: 1.0,
                    intent: 'casual_chat'
                };
            }
        }

        // 2. Rules: Simple constraints
        const words = text.split(/\s+/);
        const actionVerbs = ['create', 'plan', 'research', 'summarize', 'write', 'analyze', 'generate', 'build', 'send', 'mail', 'email', 'message', 'msg', 'save', 'update', 'append', 'read', 'put', 'insert', 'add'];
        const hasActionVerb = actionVerbs.some(verb => text.includes(verb));
        
        const moment = await MemoryManager.getMoment(message.channel_id);
        const hasActiveTask = /active task:\s*(?!none\b)\w+/i.test(moment);
        const confirmationWords = ['yes', 'confirm', 'yup', 'do it', 'go ahead', 'sure', 'ok', 'okay', 'yep', 'y', 'correct'];
        const isNumber = /^\d+$/.test(text);
        const isSingleLetter = /^[a-z]$/.test(text);
        const isConfirmation = confirmationWords.includes(text) || 
                               confirmationWords.some(word => text.startsWith(word)) ||
                               isNumber ||
                               isSingleLetter;

        // 2.3 Follow-up spreadsheet action rule (e.g. "krdo update", "save it")
        const lowerText = text.toLowerCase();
        const isFollowUpAction = lowerText.includes('update') || lowerText.includes('save') || lowerText.includes('do it') || lowerText.includes('krdo') || lowerText.includes('kardo') || lowerText.includes('kro');
        const hasSpreadsheetContext = moment.toLowerCase().includes('spreadsheet') || moment.toLowerCase().includes('routine') || moment.toLowerCase().includes('sheet');
        if (isFollowUpAction && hasSpreadsheetContext) {
            return {
                bucket: 'complex',
                rule_matched: 'rule_spreadsheet_followup',
                confidence_score: 0.95,
                intent: 'spreadsheet_request'
            };
        }

        if (words.length <= 6 && !hasActionVerb && !hasActiveTask && !isConfirmation) {
            return {
                bucket: 'simple',
                rule_matched: 'rule_length_and_verbs',
                confidence_score: 0.9,
                intent: 'casual_chat'
            };
        }

        // 2.5 Force complex if action verb is explicitly used
        if (hasActionVerb) {
            let determinedIntent: RouteResult['intent'] = 'other';
            if (text.includes('mail') || text.includes('email') || text.includes('send') || text.includes('msg') || text.includes('message')) {
                determinedIntent = 'email_request';
            } else if (text.includes('sheet') || text.includes('spreadsheet') || text.includes('excel')) {
                determinedIntent = 'spreadsheet_request';
            } else if (text.includes('research') || text.includes('summarize') || text.includes('analyze')) {
                determinedIntent = 'research';
            } else if (text.includes('create') || text.includes('build') || text.includes('plan')) {
                determinedIntent = 'command_execution';
            }
            return {
                bucket: 'complex',
                rule_matched: 'rule_action_verb',
                confidence_score: 0.9,
                intent: determinedIntent
            };
        }

        // 3. LLM Fallback (Complex vs Simple + Intent Classification)
        const systemPrompt = `
You are an intent and bucket classifier for an AI assistant.
Classify the user's message into:
1. "bucket":
   - "simple": A straightforward question, casual chat, or query that does NOT require multi-step planning or tools.
   - "complex": A task that requires multi-step planning, research, executing tools (like sending email, creating channel, searching web, or editing spreadsheets), or writing a detailed report.
2. "intent":
   - "casual_chat": Greeting, small talk, general chit-chat.
   - "emotional_support": Venting about stress, feeling overwhelmed, asking for motivation, personal comfort, or casual check-ins.
   - "email_request": Asking to draft, send, read, or manage emails.
   - "coding": Writing code, debugging, explaining software architecture.
   - "research": Asking for facts, news, web searches, detailed summaries.
   - "command_execution": Explicit commands to run processes, create files, edit configurations.
   - "spreadsheet_request": Creating, updating, reading, writing, or appending to Google Sheets or spreadsheets.
   - "other": Anything else.

### Context (Current Conversation Memory)
\${moment}

Respond ONLY with a JSON object in this format:
{"bucket": "simple" | "complex", "intent": "casual_chat" | "emotional_support" | "email_request" | "coding" | "research" | "command_execution" | "spreadsheet_request" | "other", "confidence": <float between 0 and 1>}
        `.trim();

        try {
            const llmResponse = await LLMService.chat(systemPrompt, `User Message: ${message.content}\nClassify the intent based on context.`, true);
            if (llmResponse) {
                const cleanResponse = llmResponse.replace(/```(?:json)?/gi, '').trim();
                const parsed = JSON.parse(cleanResponse);
                if (parsed.bucket === 'simple' || parsed.bucket === 'complex') {
                    const validIntents = ['casual_chat', 'emotional_support', 'email_request', 'coding', 'research', 'command_execution', 'spreadsheet_request', 'other'];
                    const finalIntent = validIntents.includes(parsed.intent) ? parsed.intent : 'other';
                    return {
                        bucket: parsed.bucket,
                        rule_matched: 'llm_classifier',
                        confidence_score: parsed.confidence || 0.5,
                        intent: finalIntent
                    };
                }
            }
        } catch (err) {
            console.error('LLM routing failed, falling back to simple.', err);
        }

        // Fallback if LLM is offline or fails to parse
        return {
            bucket: 'simple',
            rule_matched: 'fallback_error',
            confidence_score: 0.0,
            intent: 'other'
        };
    }
}
