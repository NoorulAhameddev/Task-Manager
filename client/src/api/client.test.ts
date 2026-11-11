import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import api, { setAccessToken, setOnTokenRefreshed, getAccessToken } from './client';

const okResponse = (config: InternalAxiosRequestConfig, data: unknown = {}) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
});

const unauthorizedError = (config: InternalAxiosRequestConfig) =>
  Object.assign(new Error('Unauthorized'), { config, response: { status: 401, data: { error: { message: 'Unauthorized' } } } });

describe('api client auth interceptor', () => {
  beforeEach(() => {
    setAccessToken(null);
    setOnTokenRefreshed(null);
    vi.restoreAllMocks();
  });

  it('attaches the bearer token to requests', async () => {
    setAccessToken('tok-123');
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => okResponse(config, { ok: true }));
    api.defaults.adapter = adapter;

    await api.get('/api/tasks');

    expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer tok-123');
  });

  it('refreshes the access token on a 401 and retries the request', async () => {
    let calls = 0;
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      calls += 1;
      if (calls === 1) {
        return Promise.reject(unauthorizedError(config));
      }
      return okResponse(config, [{ id: 't1' }]);
    });
    api.defaults.adapter = adapter;

    const postSpy = vi
      .spyOn(axios, 'post')
      .mockResolvedValue({ data: { accessToken: 'refreshed-token' } });

    const data = await api.get('/api/tasks');

    expect(postSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/refresh'),
      {},
      expect.objectContaining({ withCredentials: true }),
    );
    expect(getAccessToken()).toBe('refreshed-token');
    expect(calls).toBe(2);
    expect(data.data).toEqual([{ id: 't1' }]);
  });

  it('notifies listeners when a token refresh succeeds', async () => {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      return Promise.reject(unauthorizedError(config));
    });
    api.defaults.adapter = adapter;

    const onRefreshed = vi.fn();
    setOnTokenRefreshed(onRefreshed);
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'brand-new' } });

    await api.get('/api/tasks').catch(() => undefined);

    expect(onRefreshed).toHaveBeenCalledWith('brand-new');
  });

  it('clears the token and notifies listeners when refresh fails', async () => {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      return Promise.reject(unauthorizedError(config));
    });
    api.defaults.adapter = adapter;

    const onRefreshed = vi.fn();
    setOnTokenRefreshed(onRefreshed);
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh failed'));

    await expect(api.get('/api/tasks')).rejects.toThrow('refresh failed');

    expect(getAccessToken()).toBeNull();
    expect(onRefreshed).toHaveBeenCalledWith(null);
  });

  it('shares a single refresh across concurrent requests', async () => {
    let calls = 0;
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      calls += 1;
      if (calls <= 2) {
        return Promise.reject(unauthorizedError(config));
      }
      return okResponse(config);
    });
    api.defaults.adapter = adapter;

    const postSpy = vi
      .spyOn(axios, 'post')
      .mockResolvedValue({ data: { accessToken: 'shared-token' } });

    await Promise.all([api.get('/a'), api.get('/b')]);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(calls).toBe(4);
    expect(getAccessToken()).toBe('shared-token');
  });

  it('does not refresh for the refresh endpoint itself', async () => {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      return Promise.reject(unauthorizedError(config));
    });
    api.defaults.adapter = adapter;
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'x' } });

    await expect(api.post('/api/auth/refresh')).rejects.toThrow('Unauthorized');

    expect(postSpy).not.toHaveBeenCalled();
  });
});
