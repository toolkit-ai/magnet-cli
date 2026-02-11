import type { ErrorBody } from "./types";
import { getApiKey, getBaseUrl } from "./config";

function errorMessage(code: number, body: ErrorBody, _path: string): string {
  const msg =
    body.error ?? body.details ?? body.message ?? body.issues?.join("; ") ?? "";
  const text = msg || `HTTP ${code}`;
  switch (code) {
    case 401:
      return `Unauthorized: ${text} Check your API key. Set MAGNET_API_KEY.`;
    case 403:
      return `Forbidden: ${text}`;
    case 400:
      return `Bad request: ${text}`;
    case 404:
      return `Not found: ${text}`;
    case 500:
      return `Server error: ${text}`;
    default:
      return `Error ${code}: ${text}`;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public body: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createClient(apiKey?: string, baseUrl?: string) {
  const key = apiKey ?? getApiKey();
  const base = (baseUrl ?? getBaseUrl()).replace(/\/+$/, "");

  async function request<T>(
    method: string,
    path: string,
    opts?: { query?: Record<string, string>; body?: unknown }
  ): Promise<T> {
    const url = new URL(path, base);
    if (opts?.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v !== undefined && v !== "") url.searchParams.set(k, v);
      }
    }
    const headers: Record<string, string> = {
      "x-api-key": key,
    };
    if (opts?.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(url.toString(), {
      method,
      headers,
      body:
        opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    const text = await res.text();
    let parsed: unknown = null;
    try {
      if (text) parsed = JSON.parse(text);
    } catch (_) {}

    if (!res.ok) {
      const errBody = (parsed ?? {}) as ErrorBody;
      const message = errorMessage(res.status, errBody, path);
      throw new ApiError(message, res.status, parsed);
    }
    return (parsed ?? {}) as T;
  }

  return {
    get<T>(path: string, query?: Record<string, string>): Promise<T> {
      return request<T>("GET", path, { query });
    },
    post<T>(path: string, body: unknown): Promise<T> {
      return request<T>("POST", path, { body });
    },
    put<T>(path: string, body: unknown): Promise<T> {
      return request<T>("PUT", path, { body });
    },
  };
}
