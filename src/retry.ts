/**
 * HTTP retry with exponential backoff.
 * Wraps an Effect and retries transient failures (isRetryable=true).
 */

import * as Effect from "effect/Effect"
import type { LLMError } from "./schema/index.js"

export interface RetryConfig {
  /** Maximum retries before giving up (default: 3) */
  readonly maxRetries?: number
  /** Base delay in ms — doubles each attempt (default: 1000) */
  readonly baseDelayMs?: number
}

export function retryWithBackoff<T>(
  effect: Effect.Effect<T, LLMError>,
  config?: RetryConfig,
): Effect.Effect<T, LLMError> {
  const maxRetries = config?.maxRetries ?? 3
  const baseDelay = config?.baseDelayMs ?? 1000

  const attempt = (n: number): Effect.Effect<T, LLMError> =>
    effect.pipe(
      Effect.catch((error: LLMError) => {
        if (typeof (error as any).isRetryable !== "undefined" && (error as any).isRetryable === true && n < maxRetries) {
          const delay = Math.pow(2, n - 1) * baseDelay
          console.log(`[harness:retry] ${error.message} — retrying in ${delay}ms (attempt ${n + 1}/${maxRetries})`)
          return Effect.sleep(delay as number).pipe(Effect.flatMap(() => attempt(n + 1)))
        }
        return Effect.fail(error)
      }),
    )
  return attempt(1)
}
