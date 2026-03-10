import API_URL from "@/config";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function getAuthToken() {
  return localStorage.getItem("token");
}

function getSchoolId() {
  const stored = String(localStorage.getItem("schoolId") || "").trim();
  if (stored) return stored;

  const rawUser = localStorage.getItem("user");
  if (!rawUser) return "";

  try {
    const user = JSON.parse(rawUser);
    const allowed: unknown = user?.allowedSchoolIds;
    if (Array.isArray(allowed) && allowed.length > 0) {
      return String(allowed[0] || "").trim();
    }
  } catch {
    // ignore
  }

  return "";
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const method = options.method || "GET";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const schoolId = getSchoolId();
  if (schoolId) {
    headers["x-school-id"] = schoolId;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await res.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!res.ok) {
    const message = payload?.message || "Request failed";
    const err: any = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload as T;
}
