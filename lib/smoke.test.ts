import { describe, expect, it } from 'vitest';
import { usePersistedState } from '@/lib/usePersistedState';

describe('test runner setup', () => {
  it('resolves the @/ alias to a module export', () => {
    expect(typeof usePersistedState).toBe('function');
  });
});
