/**
 * Provider interface for LLM providers
 */

export interface ProviderDefinition {
  readonly id: string;
  readonly name: string;
}

export interface ProviderModelFactory {
  (modelId: string): void;
}
