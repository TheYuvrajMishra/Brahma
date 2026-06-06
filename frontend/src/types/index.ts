export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    isNew?: boolean;
}

export interface Session {
    sessionId: string;
    title: string;
    updatedAt: string;
}
