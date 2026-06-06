/**
 * Tool execution utilities
 */
export function toDefinitions(_tools) {
    return [];
}
export function tool(name, description, execute) {
    return {
        schema: { name, description, execute },
    };
}
//# sourceMappingURL=tool.js.map