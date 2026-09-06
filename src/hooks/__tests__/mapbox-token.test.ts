import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

import { useMapboxToken, resetMapboxTokenCache } from '@/hooks/useMapboxToken';
import { renderHook, waitFor } from '@testing-library/react';

describe('map configuration loading', () => {
  beforeEach(() => {
    resetMapboxTokenCache();
    invoke.mockReset();
  });

  it('reports the fallback state when the token is missing, without throwing', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { result } = renderHook(() => useMapboxToken());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.unavailable).toBe(true);
    expect(result.current.token).toBeNull();
  });

  it('never retries after a configuration failure', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const first = renderHook(() => useMapboxToken());
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    const second = renderHook(() => useMapboxToken());
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('caches a successful token for the session and requests it at most once', async () => {
    invoke.mockResolvedValue({ data: { token: 'pk.test' }, error: null });
    const a = renderHook(() => useMapboxToken());
    await waitFor(() => expect(a.result.current.token).toBe('pk.test'));
    a.rerender();
    renderHook(() => useMapboxToken());
    renderHook(() => useMapboxToken());
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('does not request anything when no map component is mounted', async () => {
    renderHook(() => useMapboxToken(false));
    expect(invoke).not.toHaveBeenCalled();
  });

  it('fails safe on an unexpected response shape', async () => {
    invoke.mockResolvedValue({ data: { token: 42 }, error: null });
    const { result } = renderHook(() => useMapboxToken());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.unavailable).toBe(true);
  });
});
