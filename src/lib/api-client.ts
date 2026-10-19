import type { PortalSessionUser } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

export function resolveApiUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type RequestOptions = RequestInit & {
  allowUnauthorized?: boolean;
  body?: BodyInit | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorMessage(response: Response) {
  const text = await response.text().catch(() => "");

  if (!text) {
    return `Request gagal (${response.status})`;
  }

  try {
    const payload = JSON.parse(text) as { message?: unknown; error?: unknown };
    const message = typeof payload.message === "string" ? payload.message : payload.error;
    return typeof message === "string" && message.trim() ? message : text;
  } catch {
    return text;
  }
}

export async function requestJson<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  if (response.status === 401 && options.allowUnauthorized) {
    return null as T;
  }

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => requestJson<T>(path, options),
  post: <T>(path: string, payload?: unknown, options?: RequestOptions) =>
    requestJson<T>(path, {
      ...options,
      method: "POST",
      body: payload === undefined ? undefined : JSON.stringify(payload),
    }),
  put: <T>(path: string, payload?: unknown, options?: RequestOptions) =>
    requestJson<T>(path, {
      ...options,
      method: "PUT",
      body: payload === undefined ? undefined : JSON.stringify(payload),
    }),
  patch: <T>(path: string, payload?: unknown, options?: RequestOptions) =>
    requestJson<T>(path, {
      ...options,
      method: "PATCH",
      body: payload === undefined ? undefined : JSON.stringify(payload),
    }),
  delete: <T>(path: string, options?: RequestOptions) =>
    requestJson<T>(path, {
      ...options,
      method: "DELETE",
    }),
};

export async function getPortalSession() {
  return requestJson<PortalSessionUser | null>("/api/portal/session", {
    allowUnauthorized: true,
  });
}

export async function signInPortal(payload: { email: string; password: string }) {
  await requestJson<unknown>("/api/auth/portal/sign-in/email", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return getPortalSession();
}

export async function signOutPortal() {
  await requestJson<unknown>("/api/auth/portal/sign-out", {
    method: "POST",
  }).catch(() => null);
}
