import { describe, it, expect } from 'vitest';
import {
  createSession,
  getSession,
  deleteSession,
  SessionStore,
} from '../src/session.js';

describe('SessionStore', () => {
  it('createSession returns a session with unique ID', () => {
    const store = new SessionStore();
    const s1 = store.create('comp-1');
    const s2 = store.create('comp-2');
    expect(s1.id).toBeDefined();
    expect(s2.id).toBeDefined();
    expect(s1.id).not.toBe(s2.id);
  });

  it('createSession stores compositionId', () => {
    const store = new SessionStore();
    const session = store.create('comp-abc');
    expect(session.compositionId).toBe('comp-abc');
  });

  it('getSession retrieves existing session', () => {
    const store = new SessionStore();
    const session = store.create('comp-1');
    const retrieved = store.get(session.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(session.id);
    expect(retrieved!.compositionId).toBe('comp-1');
  });

  it('getSession returns null for non-existent session', () => {
    const store = new SessionStore();
    expect(store.get('nonexistent')).toBeNull();
  });

  it('deleteSession removes session', () => {
    const store = new SessionStore();
    const session = store.create('comp-1');
    store.delete(session.id);
    expect(store.get(session.id)).toBeNull();
  });

  it('session has initialized flag', () => {
    const store = new SessionStore();
    const session = store.create('comp-1');
    expect(session.initialized).toBe(false);
  });

  it('can mark session as initialized', () => {
    const store = new SessionStore();
    const session = store.create('comp-1');
    store.markInitialized(session.id);
    const updated = store.get(session.id);
    expect(updated!.initialized).toBe(true);
  });

  it('session has createdAt timestamp', () => {
    const store = new SessionStore();
    const session = store.create('comp-1');
    expect(typeof session.createdAt).toBe('string');
  });
});

// Functional wrappers
describe('functional session helpers', () => {
  it('createSession creates and returns session', () => {
    const session = createSession('comp-1');
    expect(session.id).toBeDefined();
    expect(session.compositionId).toBe('comp-1');
  });

  it('getSession retrieves session by ID', () => {
    const session = createSession('comp-2');
    const found = getSession(session.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(session.id);
  });

  it('deleteSession removes session', () => {
    const session = createSession('comp-3');
    deleteSession(session.id);
    expect(getSession(session.id)).toBeNull();
  });
});
