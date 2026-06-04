import { NormalizedMessage, PipelineResponse } from '../types/Message';

export interface Adapter {
    /**
     * Initializes the adapter (e.g. connecting to Discord).
     */
    init(onMessage: (msg: NormalizedMessage) => void): Promise<void>;

    /**
     * Emits a response back to the platform.
     */
    emit(response: PipelineResponse): Promise<void>;
}
