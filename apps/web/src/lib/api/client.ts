import { getSession } from 'next-auth/react';
import type { ApiResponse, PaginatedResponse } from '@sovereign/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type RequestOptions = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
};

// Cache session to avoid redundant /api/auth/session calls on parallel requests
let sessionCache: { token: string; expiresAt: number } | null = null;
const SESSION_CACHE_MS = 30_000; // 30s

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (sessionCache && Date.now() < sessionCache.expiresAt) {
    return { Authorization: `Bearer ${sessionCache.token}` };
  }
  const session = await getSession();
  if (session?.accessToken) {
    sessionCache = { token: session.accessToken, expiresAt: Date.now() + SESSION_CACHE_MS };
    return { Authorization: `Bearer ${session.accessToken}` };
  }
  sessionCache = null;
  return {};
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, headers = {} } = options;
  const authHeaders = await getAuthHeaders();

  const res = await fetch(buildUrl(path, params), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
    return request<ApiResponse<T>>(path, { params });
  },

  getPaginated<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
    return request<PaginatedResponse<T>>(path, { params });
  },

  post<T>(path: string, body?: unknown) {
    return request<ApiResponse<T>>(path, { method: 'POST', body });
  },

  patch<T>(path: string, body?: unknown) {
    return request<ApiResponse<T>>(path, { method: 'PATCH', body });
  },

  delete<T>(path: string) {
    return request<ApiResponse<T>>(path, { method: 'DELETE' });
  },
};
