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
        const actionVerbs = ['create', 'plan', 'research', 'summarize', 'write', 'analyze', 'generate', 'build', 'send', 'mail', 'email', 'message', 'msg', 'save', 'update', 'append', 'read', 'put', 'insert', 'add', 'remove', 'delete', 'clear', 'fix', 'clean', 'format', 'design', 'style'];
        const hasActionVerb = actionVerbs.some(verb => text.includes(verb));
        
        const questionWords = ['what', 'who', 'when', 'where', 'why', 'how', 'which', 'explain', 'search', 'find', 'news', 'protest', 'latest', 'today', 'price', 'define', 'meaning'];
        const isQuestion = questionWords.some(qw => text.toLowerCase().includes(qw));

        const moment = await MemoryManager.getMoment(message.user_id, message.channel_id);
        const hasActiveTask = /active task:\s*(?!none\b)\w+/i.test(moment);
        const confirmationWords = ['yes', 'confirm', 'yup', 'do it', 'go ahead', 'sure', 'ok', 'okay', 'yep', 'y', 'correct'];
        const isNumber = /^\d+$/.test(text);
        const isSingleLetter = /^[a-z]$/.test(text);
        const isConfirmation = confirmationWords.includes(text) || 
                               confirmationWords.some(word => text.startsWith(word)) ||
                               isNumber ||
                               isSingleLetter;

        // 2.3 Follow-up spreadsheet action rule (e.g. "krdo update", "save it", "remove extra ones", "hatao")
        const lowerText = text.toLowerCase();
        const isFollowUpAction = lowerText.includes('update') || lowerText.includes('save') || lowerText.includes('do it') || lowerText.includes('krdo') || lowerText.includes('kardo') || lowerText.includes('kro') || lowerText.includes('remove') || lowerText.includes('delete') || lowerText.includes('clear') || lowerText.includes('hatao') || lowerText.includes('hata') || lowerText.includes('kam karo') || lowerText.includes('clean') || lowerText.includes('fix');
        const hasSpreadsheetContext = moment.toLowerCase().includes('spreadsheet') || moment.toLowerCase().includes('routine') || moment.toLowerCase().includes('sheet') || moment.toLowerCase().includes('checkbox');
        if (isFollowUpAction && hasSpreadsheetContext) {
            return {
                bucket: 'complex',
                rule_matched: 'rule_spreadsheet_followup',
                confidence_score: 0.95,
                intent: 'spreadsheet_request'
            };
        }

        if (isQuestion) {
            return {
                bucket: 'complex',
                rule_matched: 'rule_question_research',
                confidence_score: 0.95,
                intent: 'research'
            };
        }

        if (words.length <= 6 && !hasActionVerb && !isQuestion && !hasActiveTask && !isConfirmation) {
            return {
                bucket: 'simple',
                rule_matched: 'rule_length_and_verbs',
                confidence_score: 0.9,
                intent: 'casual_chat'
            };
        }

        // 2.5 Action verb & email instruction determination with context checking
        const containsEmailAddress = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
        const lowerMoment = moment.toLowerCase();
        const isEmailFollowUp = (text === 'just mail' || text === 'send it' || text === 'mail it' || text === 'send now' || text.includes('bhej do') || text.includes('send email') || text.includes('send mail') || text === 'mail') &&
                                (lowerMoment.includes('email') || lowerMoment.includes('mail') || lowerMoment.includes('draft'));

        const hasExplicitEmailInstruction = /(^|\s)(send|mail|write|compose|dispatch)\s+(an?\s+)?(email|mail|msg|message)/i.test(text) ||
                                            /(^|\s)send\s+([^\s]+@[^\s]+|to\s+)/i.test(text) ||
                                            /(^|\s)(email|mail|msg)\s+to\s+/i.test(text) ||
                                            /(^|\s)mail\s+[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(text) ||
                                            isEmailFollowUp;

        if (hasExplicitEmailInstruction || (containsEmailAddress && hasActionVerb)) {
            let determinedIntent: RouteResult['intent'] = 'other';
            if (hasExplicitEmailInstruction || containsEmailAddress) {
                determinedIntent = 'email_request';
            } else if (text.includes('sheet') || text.includes('spreadsheet') || text.includes('excel') || text.includes('checkbox') || text.includes('checkboxes') || text.includes('routine') || text.includes('daily routine') || text.includes('column') || text.includes('row')) {
                determinedIntent = 'spreadsheet_request';
            } else if (text.includes('research') || text.includes('summarize') || text.includes('analyze')) {
                determinedIntent = 'research';
            } else if (text.includes('create') || text.includes('build') || text.includes('plan')) {
                determinedIntent = 'command_execution';
            }

            if (determinedIntent !== 'other') {
                return {
                    bucket: 'complex',
                    rule_matched: 'rule_action_verb',
                    confidence_score: 0.95,
                    intent: determinedIntent
                };
            }
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
${moment}

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
