const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type ApiRequestOptions = RequestInit & {
  /** When true, 401 will throw instead of redirecting (for auth check endpoints) */
  skipAuthRedirect?: boolean;
};

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let navigateToLogin: (() => void) | null = null;
export function setNavigateToLogin(fn: () => void) {
  navigateToLogin = fn;
}

async function request<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipAuthRedirect, ...fetchOptions } = options;
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    ...fetchOptions,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  });

  if (res.status === 401) {
    if (skipAuthRedirect) {
      throw new ApiError(401, "Not authenticated");
    }
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retryRes = await fetch(url, {
        ...fetchOptions,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions.headers,
        },
      });
      if (!retryRes.ok) {
        const data = await retryRes.json().catch(() => ({}));
        throw new ApiError(retryRes.status, data.error ?? "Request failed", data.details);
      }
      return retryRes.json() as Promise<T>;
    }
    if (navigateToLogin) {
      navigateToLogin();
    } else {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Session expired");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error ?? "Request failed", data.details);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { method: "GET", ...options }),

  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { method: "DELETE", ...options }),
};

export { ApiError };
