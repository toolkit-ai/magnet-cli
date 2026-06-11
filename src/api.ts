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
    case 409:
      return `Conflict: ${text}`;
    case 500:
      return `Server error: ${text}`;
    case 503:
      return `Service unavailable: ${text}`;
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
  return createClientWithHeaders({ "x-api-key": key }, baseUrl);
}

/** Client with caller-provided auth headers (org API key or Bearer CLI token). */
export function createClientWithHeaders(
  authHeaders: Record<string, string>,
  baseUrl?: string
) {
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
    const headers: Record<string, string> = { ...authHeaders };
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
    delete<T>(path: string, query?: Record<string, string>): Promise<T> {
      return request<T>("DELETE", path, { query });
    },
  };
}

/**
 * Upload a file to a presigned URL (e.g. R2). No API key or Magnet headers.
 * Optionally report progress to stderr via onProgress(bytesUploaded, totalBytes).
 */
export async function uploadToPresignedUrl(
  presignedUrl: string,
  filePath: string,
  onProgress?: (bytesUploaded: number, totalBytes: number) => void
): Promise<void> {
  const file = Bun.file(filePath);
  const totalBytes = file.size;

  if (onProgress) onProgress(0, totalBytes);
  const arrayBuffer = await file.arrayBuffer();
  if (onProgress) onProgress(totalBytes, totalBytes);

  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/x-tar",
      "Content-Length": String(totalBytes),
    },
    body: arrayBuffer,
  });

  if (!res.ok) {
    const text = await res.text();
    let msg: string;
    try {
      const parsed = JSON.parse(text) as ErrorBody;
      const fromBody = parsed.error ?? parsed.details ?? parsed.message;
      msg = fromBody ?? (text ? text : `HTTP ${res.status}`);
    } catch {
      msg = text ? text : `HTTP ${res.status}`;
    }
    throw new ApiError(`Upload failed: ${msg}`, res.status, text);
  }
}
