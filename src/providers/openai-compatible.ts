/**
 * OpenAI-compatible provider
 */

import type { ProviderDefinition, ProviderModelFactory } from "../provider.js";

export const id = "openai-compatible";

export const provider: ProviderDefinition = {
  id,
  name: "OpenAI Compatible",
};

export const configure = (_baseURL: string): ProviderModelFactory => {
  return (_modelId: string) => {
    // Configure model with baseURL
  };
};
