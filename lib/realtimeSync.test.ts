import { describe, expect, it } from 'vitest';
import { createResponseGate, shouldRefetchOnStatus } from '@/lib/realtimeSync';

describe('shouldRefetchOnStatus', () => {
  it('refetches on the first join', () => {
    expect(shouldRefetchOnStatus(null, 'SUBSCRIBED')).toBe(true);
  });

  it('refetches when the channel rejoins after a drop', () => {
    expect(shouldRefetchOnStatus('CHANNEL_ERROR', 'SUBSCRIBED')).toBe(true);
    expect(shouldRefetchOnStatus('TIMED_OUT', 'SUBSCRIBED')).toBe(true);
    expect(shouldRefetchOnStatus('CLOSED', 'SUBSCRIBED')).toBe(true);
  });

  it('does not refetch on a repeated SUBSCRIBED', () => {
    expect(shouldRefetchOnStatus('SUBSCRIBED', 'SUBSCRIBED')).toBe(false);
  });

  it('does not refetch on failure states', () => {
    for (const status of ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED']) {
      expect(shouldRefetchOnStatus('SUBSCRIBED', status)).toBe(false);
      expect(shouldRefetchOnStatus(null, status)).toBe(false);
    }
  });
});

describe('createResponseGate', () => {
  it('accepts responses that arrive in order', () => {
    const gate = createResponseGate();
    const a = gate.begin();
    expect(gate.accept(a)).toBe(true);
    const b = gate.begin();
    expect(gate.accept(b)).toBe(true);
  });

  it('drops an older response that arrives after a newer one', () => {
    const gate = createResponseGate();
    const older = gate.begin();
    const newer = gate.begin();
    expect(gate.accept(newer)).toBe(true);
    expect(gate.accept(older)).toBe(false);
  });

  it('accepts an older response while the newer one is still pending', () => {
    const gate = createResponseGate();
    const older = gate.begin();
    const newer = gate.begin();
    expect(gate.accept(older)).toBe(true);
    expect(gate.accept(newer)).toBe(true);
  });

  it('accepts each ticket only once', () => {
    const gate = createResponseGate();
    const t = gate.begin();
    expect(gate.accept(t)).toBe(true);
    expect(gate.accept(t)).toBe(false);
  });
});
