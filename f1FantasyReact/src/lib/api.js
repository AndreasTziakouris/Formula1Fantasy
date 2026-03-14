const DEFAULT_API_URL = "http://localhost:3000";

const rawApiUrl = import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_URL;

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");

const AUTH_KEYS = ["token", "userId", "userRole"];

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export const getAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("token");
};

export const getStoredUserRole = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("userRole");
};

export const setStoredAuth = ({ token, userId, role }) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem("token", token);
  window.localStorage.setItem("userId", userId);
  window.localStorage.setItem("userRole", role);
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of AUTH_KEYS) {
    window.localStorage.removeItem(key);
  }
};

export const buildApiUrl = (path) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const parseResponseBody = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
};

export const apiRequest = async (
  path,
  { auth = false, headers = {}, body, ...options } = {}
) => {
  const requestHeaders = new Headers(headers);

  if (auth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  const serializedBody =
    body !== undefined && body !== null && !isFormData
      ? JSON.stringify(body)
      : body;

  if (!isFormData && serializedBody !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: requestHeaders,
    body: serializedBody,
  });

  const data = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();

      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/auth")
      ) {
        window.location.assign("/auth/login");
      }
    }

    throw new ApiError(
      data?.message || "Request failed",
      response.status,
      data
    );
  }

  return data;
};
