import { ApiResponse, ApiErrorResponse } from "../types/api.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export interface RequestOptions extends RequestInit {
  token?: string;
  requestedInstitutionId?: string;
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

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { token, requestedInstitutionId, headers: customHeaders, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Optional requested institution context (verified server-side)
  if (requestedInstitutionId) {
    headers["X-Institution-Id"] = requestedInstitutionId;
  }

  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

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
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
