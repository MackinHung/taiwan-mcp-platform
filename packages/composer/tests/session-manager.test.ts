import { describe, it, expect } from 'vitest';
import { SessionManager } from '../src/session-manager.js';

describe('SessionManager', () => {
  it('creates a session and returns a session ID', () => {
    const manager = new SessionManager();
    const sessionId = manager.create('comp-1', 'user-1');
    expect(sessionId).toBeTruthy();
    expect(typeof sessionId).toBe('string');
    expect(sessionId.length).toBeGreaterThan(0);
  });

  it('validates a valid session ID', () => {
    const manager = new SessionManager();
    const sessionId = manager.create('comp-1', 'user-1');
    const session = manager.get(sessionId);
    expect(session).not.toBeNull();
    expect(session!.compositionId).toBe('comp-1');
    expect(session!.userId).toBe('user-1');
  });

  it('returns null for invalid session ID', () => {
    const manager = new SessionManager();
    const session = manager.get('nonexistent-id');
    expect(session).toBeNull();
  });

  it('deletes a session', () => {
    const manager = new SessionManager();
    const sessionId = manager.create('comp-1', 'user-1');
    const deleted = manager.delete(sessionId);
    expect(deleted).toBe(true);
    expect(manager.get(sessionId)).toBeNull();
  });

  it('returns false when deleting non-existent session', () => {
    const manager = new SessionManager();
    const deleted = manager.delete('nonexistent-id');
    expect(deleted).toBe(false);
  });

  it('generates unique session IDs', () => {
    const manager = new SessionManager();
    const id1 = manager.create('comp-1', 'user-1');
    const id2 = manager.create('comp-1', 'user-1');
    expect(id1).not.toBe(id2);
  });
});
