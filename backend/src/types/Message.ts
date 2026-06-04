export interface NormalizedMessage {
    user_id: string;
    platform: string;
    channel_id: string;
    content: string;
    timestamp: Date;
    message_id: string;
    attachments?: any[];
}

export interface PipelineResponse {
    originalMessage: NormalizedMessage;
    content: string;
}
