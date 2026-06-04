import { EventEmitter } from 'events';

export const EventBus = new EventEmitter();

// Define standard events
export enum SystemEvents {
    MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
    ROUTING_COMPLETE = 'ROUTING_COMPLETE',
    PIPELINE_COMPLETE = 'PIPELINE_COMPLETE',
    PIPELINE_ERROR = 'PIPELINE_ERROR'
}
