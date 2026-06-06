/**
 * OpenAI Chat protocol
 */

export const protocolId = "openai-chat";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}
