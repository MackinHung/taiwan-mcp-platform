import type { SessionState } from './types.js';

export class SessionStore {
  private sessions = new Map<string, SessionState>();

  create(compositionId: string, userId: string): string {
    const id = crypto.randomUUID();
    this.sessions.set(id, {
      composition_id: compositionId,
      user_id: userId,
      initialized: false,
      tools_loaded: false,
    });
    return id;
  }

  get(id: string): SessionState | null {
    return this.sessions.get(id) ?? null;
  }

  update(id: string, updates: Partial<SessionState>): void {
    const session = this.sessions.get(id);
    if (session) {
      this.sessions.set(id, { ...session, ...updates });
    }
  }

  delete(id: string): boolean {
    return this.sessions.delete(id);
  }
}
