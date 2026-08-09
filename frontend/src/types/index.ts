export interface TelemetryStep {
    id: string;
    event: string;
    stage: string;
    label: string;
    timestamp: string;
    details?: any;
    status?: 'pending' | 'active' | 'completed' | 'failed';
}

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    isNew?: boolean;
    telemetry?: TelemetryStep[];
}

export interface Session {
    sessionId: string;
    title: string;
    updatedAt: string;
}

export interface UserProfile {
    id: string;
    googleId: string;
    email: string;
    name: string;
    picture: string;
    onboardingCompleted: boolean;
    profileDetails?: {
        displayName?: string;
        role?: string;
        location?: string;
        preferredHandle?: string;
    };
    preferences?: string;
    dislikes?: string;
    interactionStyle?: 'analytical' | 'conversational' | 'executive';
}
