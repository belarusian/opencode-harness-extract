/**
 * The `ResponseIdTracker` module provides a small service for reusing provider
 * response IDs across incremental language model calls. It records which prompt
 * message objects were sent for a provider response, then prepares a later
 * prompt by returning the recognized `previousResponseId` together with only
 * the new messages that should be sent.
 *
 * Use this when integrating providers that support continuing a conversation
 * from a prior response ID instead of resending the entire prompt. The tracker
 * is intentionally identity-based and mutable: it only recognizes the same
 * message objects that were previously marked, and it clears its state when a
 * prompt can no longer be matched safely.
 *
 * @since 4.0.0
 */
import * as Context from "../../Context.js";
import * as Effect from "../../Effect.js";
import * as Option from "../../Option.js";
import * as Prompt from "./Prompt.js";
/**
 * Service tag for enabling provider previous-response ID reuse across language
 * model calls.
 *
 * **When to use**
 *
 * When provided, language model operations can use the tracker to send only new
 * prompt messages together with the provider's prior response ID.
 *
 * @category services
 * @since 4.0.0
 */
export class ResponseIdTracker extends /*#__PURE__*/Context.Service()("effect/ai/ResponseIdTracker") {}
/**
 * Creates an in-memory `ResponseIdTracker` service.
 *
 * **Details**
 *
 * The tracker maps prompt message object identities to provider response IDs.
 * `prepareUnsafe` returns a previous response ID and the messages after the
 * latest assistant turn only when the existing prompt prefix is fully tracked;
 * otherwise it clears the tracked state and returns `Option.none()`.
 *
 * @category constructors
 * @since 4.0.0
 */
export const make = /*#__PURE__*/Effect.sync(() => {
  const sentParts = new Map();
  const none = () => {
    sentParts.clear();
    return Option.none();
  };
  return {
    clearUnsafe() {
      sentParts.clear();
    },
    markParts(parts, responseId) {
      for (let i = 0; i < parts.length; i++) {
        sentParts.set(parts[i], responseId);
      }
    },
    prepareUnsafe(prompt) {
      const messages = prompt.content;
      let anyTracked = false;
      for (let i = 0; i < messages.length; i++) {
        if (sentParts.has(messages[i])) {
          anyTracked = true;
          break;
        }
      }
      if (!anyTracked) return none();
      let lastAssistantIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "assistant") {
          lastAssistantIndex = i;
          break;
        }
      }
      if (lastAssistantIndex === -1) return none();
      let responseId;
      for (let i = 0; i < lastAssistantIndex; i++) {
        const id = sentParts.get(messages[i]);
        if (id === undefined) return none();
        responseId = id;
      }
      if (responseId === undefined) return none();
      const partsAfterLastAssistant = messages.slice(lastAssistantIndex + 1);
      if (partsAfterLastAssistant.length === 0) {
        return none();
      }
      return Option.some({
        previousResponseId: responseId,
        prompt: Prompt.fromMessages(partsAfterLastAssistant)
      });
    }
  };
});
//# sourceMappingURL=ResponseIdTracker.js.map