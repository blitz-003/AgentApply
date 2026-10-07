export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type RequestOptions = RequestInit;

const DEFAULT_TIMEOUT_MS = 15000;
export const AUTH_TIMEOUT_MS = 4000;
const UPLOAD_TIMEOUT_MS = 120000;

/**
 * Structured error detail returned by the backend for AI failures:
 * `{ code, message, provider_code?, provider_status?, reason?, path?, missing? }`
 */
export interface ApiErrorDetail {
  code: string;
  message: string;
  provider_code?: string;
  provider_status?: number;
  reason?: string;
  path?: string;
  missing?: string[];
  retry_after?: number;
}

function isApiErrorDetail(value: unknown): value is ApiErrorDetail {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ApiErrorDetail).code === "string" &&
    typeof (value as ApiErrorDetail).message === "string"
  );
}

export class ApiError extends Error {
  readonly status: number;
  readonly retryAfter: number | null;
  /** Stable machine-readable cause, e.g. "ai_output_truncated". */
  readonly code: string | null;
  /** The upstream provider's own code, e.g. "json_validate_failed". */
  readonly providerCode: string | null;
  readonly providerStatus: number | null;
  /** Sanitised upstream explanation. */
  readonly reason: string | null;
  /** JSON path that failed schema validation, e.g. "/resume_data". */
  readonly path: string | null;
  /** Schema fields the response was missing. */
  readonly missing: string[];

  constructor(
    message: string,
    status: number,
    retryAfter: number | null = null,
    detail?: ApiErrorDetail,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
    this.code = detail?.code ?? null;
    this.providerCode = detail?.provider_code ?? null;
    this.providerStatus = detail?.provider_status ?? null;
    this.reason = detail?.reason ?? null;
    this.path = detail?.path ?? null;
    this.missing = detail?.missing ?? [];
  }

  /** True when the AI provider's rate limits were hit and a retry may work. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }

  /** Single-line diagnostic: our code plus the provider's, when they differ. */
  get diagnostic(): string {
    const parts = [`HTTP ${this.status}`];
    if (this.code) parts.push(this.code);
    if (this.providerCode && this.providerCode !== this.code) {
      parts.push(`provider=${this.providerCode}`);
    }
    if (this.providerStatus) parts.push(`status=${this.providerStatus}`);
    if (this.path) parts.push(`at=${this.path}`);
    if (this.missing.length) parts.push(`missing=${this.missing.join(",")}`);
    return parts.join(" | ");
  }

  /** Everything known about the failure, for logs and detail panels. */
  toDetailLines(): string[] {
    const lines = [this.diagnostic];
    if (this.reason) lines.push(`reason: ${this.reason}`);
    return lines;
  }
}

async function toApiError(response: Response, fallback: string): Promise<ApiError> {
  const retryAfterHeader = response.headers.get("Retry-After");
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : null;
  return response
    .json()
    .then((body) => {
      const raw = body?.detail;
      if (isApiErrorDetail(raw)) {
        return new ApiError(raw.message, response.status, retryAfter, raw);
      }
      // Plain-string detail: still surface the HTTP status rather than a bare
      // statusText, and still expose the body when there is one.
      const detail =
        typeof raw === "string" && raw
          ? raw
          : `${fallback} (HTTP ${response.status})`;
      return new ApiError(detail, response.status, retryAfter, {
        code: `http_${response.status}`,
        message: detail,
      });
    })
    .catch(() => {
      const detail = `${fallback} (HTTP ${response.status})`;
      return new ApiError(detail, response.status, retryAfter, {
        code: `http_${response.status}`,
        message: detail,
      });
    });
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    credentials: "include",
    signal: options.signal ?? AbortSignal.timeout(timeoutMs),
    headers: {
      // Only send Content-Type when there is a body. Setting it on a GET makes
      // the request non-simple, which forces a CORS preflight (OPTIONS) before
      // every call and doubles the round-trips to the API.
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    throw await toApiError(response, `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

async function uploadRequest<T>(
  endpoint: string,
  formData: FormData,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    credentials: "include",
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    throw await toApiError(response, `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, timeoutMs?: number) =>
    request<T>(endpoint, {}, timeoutMs),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
  upload: <T>(endpoint: string, formData: FormData) =>
    uploadRequest<T>(endpoint, formData),
};
