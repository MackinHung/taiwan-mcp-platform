export interface McpSession {
  readonly compositionId: string;
  readonly userId: string;
  readonly createdAt: number;
}

/**
 * Manages MCP Streamable HTTP sessions.
 * Sessions are created on initialize and referenced by Mcp-Session-Id header.
 */
export class SessionManager {
  private readonly sessions = new Map<string, McpSession>();

  create(compositionId: string, userId: string): string {
    const id = crypto.randomUUID();
    const session: McpSession = {
      compositionId,
      userId,
      createdAt: Date.now(),
    };
    this.sessions.set(id, session);
    return id;
  }

  get(id: string): McpSession | null {
    return this.sessions.get(id) ?? null;
  }

  delete(id: string): boolean {
    return this.sessions.delete(id);
  }
}
