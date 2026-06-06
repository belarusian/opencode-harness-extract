/**
 * LLMConfig - Configuration types
 */

export interface LLMConfig {
  readonly baseUrl: string;
  readonly model: string;
  readonly apiKey?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
}
