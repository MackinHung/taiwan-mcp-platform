import { describe, it, expect, beforeEach } from 'vitest';
import {
  SessionStore,
} from '../src/session.js';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore();
  });

  it('createSession returns a session with unique ID', () => {
    const s1 = store.create('comp-1', 'user-1');
    const s2 = store.create('comp-2', 'user-2');
    expect(s1).toBeDefined();
    expect(s2).toBeDefined();
    expect(s1).not.toBe(s2);
  });

  it('getSession retrieves existing session', () => {
    const id = store.create('comp-1', 'user-1');
    const session = store.get(id);
    expect(session).not.toBeNull();
    expect(session!.composition_id).toBe('comp-1');
    expect(session!.user_id).toBe('user-1');
  });

  it('getSession returns null for non-existent ID', () => {
    expect(store.get('nonexistent-id')).toBeNull();
  });

  it('session starts with initialized=false', () => {
    const id = store.create('comp-1', 'user-1');
    const session = store.get(id);
    expect(session!.initialized).toBe(false);
  });

  it('session starts with tools_loaded=false', () => {
    const id = store.create('comp-1', 'user-1');
    const session = store.get(id);
    expect(session!.tools_loaded).toBe(false);
  });

  it('updateSession changes initialized state', () => {
    const id = store.create('comp-1', 'user-1');
    store.update(id, { initialized: true });
    const session = store.get(id);
    expect(session!.initialized).toBe(true);
  });

  it('updateSession changes tools_loaded state', () => {
    const id = store.create('comp-1', 'user-1');
    store.update(id, { tools_loaded: true });
    const session = store.get(id);
    expect(session!.tools_loaded).toBe(true);
  });

  it('deleteSession removes session', () => {
    const id = store.create('comp-1', 'user-1');
    const deleted = store.delete(id);
    expect(deleted).toBe(true);
    expect(store.get(id)).toBeNull();
  });

  it('deleteSession returns false for non-existent session', () => {
    expect(store.delete('nonexistent')).toBe(false);
  });

  it('multiple sessions can coexist', () => {
    const id1 = store.create('comp-1', 'user-1');
    const id2 = store.create('comp-2', 'user-2');
    const id3 = store.create('comp-3', 'user-3');

    expect(store.get(id1)).not.toBeNull();
    expect(store.get(id2)).not.toBeNull();
    expect(store.get(id3)).not.toBeNull();
    expect(store.get(id1)!.composition_id).toBe('comp-1');
    expect(store.get(id2)!.composition_id).toBe('comp-2');
    expect(store.get(id3)!.composition_id).toBe('comp-3');
  });

  it('update does nothing for non-existent session', () => {
    // Should not throw
    store.update('nonexistent', { initialized: true });
    expect(store.get('nonexistent')).toBeNull();
  });
});
