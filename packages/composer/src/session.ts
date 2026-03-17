export interface Session {
  id: string;
  compositionId: string;
  initialized: boolean;
  createdAt: string;
}

export class SessionStore {
  private sessions = new Map<string, Session>();

  create(compositionId: string): Session {
    const session: Session = {
      id: crypto.randomUUID(),
      compositionId,
      initialized: false,
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  get(id: string): Session | null {
    return this.sessions.get(id) ?? null;
  }

  delete(id: string): void {
    this.sessions.delete(id);
  }

  markInitialized(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      this.sessions.set(id, { ...session, initialized: true });
    }
  }
}

// Global store instance for functional helpers
const globalStore = new SessionStore();

export function createSession(compositionId: string): Session {
  return globalStore.create(compositionId);
}

export function getSession(id: string): Session | null {
  return globalStore.get(id);
}

export function deleteSession(id: string): void {
  globalStore.delete(id);
}
