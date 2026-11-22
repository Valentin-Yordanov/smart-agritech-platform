const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export function getClientAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  // 1. Try reading access_token from document.cookie
  const cookieMatch = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  if (cookieMatch && cookieMatch[1]) {
    return decodeURIComponent(cookieMatch[1]);
  }
  // 2. Fallback to localStorage
  try {
    return localStorage.getItem("access_token");
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const token = getClientAccessToken();

  const config: RequestInit = {
    ...rest,
    credentials: "include", // Send HttpOnly cookies for same-origin & cross-origin credentials
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, config);

  if (response.status === 204) {
    return undefined as T;
  }

  // Clear stale client token if unauthorized
  if (response.status === 401 && typeof window !== "undefined") {
    document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
    try {
      localStorage.removeItem("access_token");
    } catch {
      // ignore
    }
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? Array.isArray((data as { message: unknown }).message)
          ? (data as { message: string[] }).message.join(", ")
          : String((data as { message: unknown }).message)
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}
