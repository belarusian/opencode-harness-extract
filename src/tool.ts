/**
 * Tool execution utilities
 */

import * as Effect from "effect/Effect";

export interface ToolSchema<T> {
  readonly name: string;
  readonly description: string;
  readonly execute: (input: T) => Effect.Effect<unknown, Error>;
}

export interface Tool<T> {
  readonly schema: ToolSchema<T>;
}

export interface ToolFailure {
  readonly error: Error;
}

export function toDefinitions<T>(_tools: Tool<T>[]): unknown {
  return [];
}

export function tool<T>(
  name: string,
  description: string,
  execute: (input: T) => Effect.Effect<unknown, Error>,
): Tool<T> {
  return {
    schema: { name, description, execute },
  };
}

export interface Tools {
  [key: string]: Tool<unknown>;
}

export interface AnyTool {
  schema: ToolSchema<unknown>;
}

export interface ExecutableTool {
  _tag: "ExecutableTool";
}

export interface ExecutableTools {
  [key: string]: ExecutableTool;
}

export interface ToolExecute {
  (tool: AnyTool, input: unknown): Effect.Effect<unknown, Error>;
}

export interface ToolExecuteContext {
  // Context for tool execution
}
