import { ApiResponse, ApiErrorResponse, AuthResponseData } from "../types/api.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

/**
 * Access Token Runtime Memory Store
 *
 * SECURITY REQUIREMENT:
 * The short-lived access token is held STRICTLY in module runtime memory.
 * It is NEVER persisted to localStorage, sessionStorage, IndexedDB, or client-accessible cookies.
 */
let inMemoryAccessToken: string | null = null;

export function setInMemoryAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getInMemoryAccessToken(): string | null {
  return inMemoryAccessToken;
}

export interface RequestOptions extends RequestInit {
  token?: string;
  skipAuthRefresh?: boolean;
}

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(errorResponse: ApiErrorResponse) {
    super(errorResponse.message);
    this.name = "ApiClientError";
    this.statusCode = errorResponse.statusCode;
    this.errorCode = errorResponse.errorCode;
    this.details = errorResponse.details;
  }
}

// Concurrency lock for token refreshing
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

/**
 * Executes a typed HTTP request with:
 * 1. Automatic in-memory Bearer token injection
 * 2. HTTP-only cookie support (credentials: 'include')
 * 3. Mandatory anti-CSRF request header on state-changing methods
 * 4. Transparent 401 access-token refresh interceptor
 */
export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { token, skipAuthRefresh, headers: customHeaders, ...fetchOptions } = options;
  const method = (fetchOptions.method || "GET").toUpperCase();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) || {}),
  };

  // Anti-CSRF Header for state-changing requests
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    headers["X-AAVAaz-CSRF"] = "1";
  }

  // Inject Bearer token from runtime memory if available
  const activeToken = token || inMemoryAccessToken;
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }

  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: "include", // Transport HTTP-only cookies
  });

  // Handle 401 Unauthorized with silent token refresh
  if (
    response.status === 401 &&
    !skipAuthRefresh &&
    !endpoint.includes("/auth/login") &&
    !endpoint.includes("/auth/refresh") &&
    !endpoint.includes("/auth/logout")
  ) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshResponse = await request<AuthResponseData>("/auth/refresh", {
          method: "POST",
          skipAuthRefresh: true,
        });

        const newToken = refreshResponse.data.accessToken;
        setInMemoryAccessToken(newToken);
        isRefreshing = false;
        onTokenRefreshed(newToken);

        // Retry original request with new in-memory token
        return request<T>(endpoint, {
          ...options,
          token: newToken,
          skipAuthRefresh: true,
        });
      } catch (refreshErr) {
        isRefreshing = false;
        setInMemoryAccessToken(null);
        onTokenRefreshed(null);
        throw refreshErr;
      }
    } else {
      // Queue request while refresh is in flight
      return new Promise<ApiResponse<T>>((resolve, reject) => {
        addRefreshSubscriber((newToken) => {
          if (newToken) {
            resolve(
              request<T>(endpoint, {
                ...options,
                token: newToken,
                skipAuthRefresh: true,
              })
            );
          } else {
            reject(new Error("Session expired"));
          }
        });
      });
    }
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Unexpected server response (${response.status})`);
  }

  if (!response.ok || !data.success) {
    throw new ApiClientError(data as ApiErrorResponse);
  }

  return data as ApiResponse<T>;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
