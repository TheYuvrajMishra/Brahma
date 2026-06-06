export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface Session {
    sessionId: string;
    title: string;
    updatedAt: string;
}
