/**
 * Schema definitions
 */
export interface LLMRequest {
    model: string;
    messages: Array<{
        role: string;
        content: string;
    }>;
}
export interface LLMResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}
//# sourceMappingURL=schema.d.ts.map