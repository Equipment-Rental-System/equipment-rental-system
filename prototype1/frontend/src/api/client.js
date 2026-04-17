const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
const API_ROOT = API_BASE_URL.replace(/\/api\/?$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: options.isFormData
      ? options.headers || {}
      : {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
    body: options.body,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(data?.message || "요청 처리 중 오류가 발생했습니다.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  request,
  get: (path, token) => request(path, { headers: authHeaders(token) }),
  post: (path, body, token) =>
    request(path, {
      method: "POST",
      body: JSON.stringify(body),
      headers: authHeaders(token),
    }),
  put: (path, body, token) =>
    request(path, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: authHeaders(token),
    }),
  patch: (path, body, token) =>
    request(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      headers: authHeaders(token),
    }),
  postForm: (path, formData, token) =>
    request(path, {
      method: "POST",
      body: formData,
      isFormData: true,
      headers: authHeaders(token),
    }),
  putForm: (path, formData, token) =>
    request(path, {
      method: "PUT",
      body: formData,
      isFormData: true,
      headers: authHeaders(token),
    }),
};

export function buildUploadUrl(relativePath) {
  if (!relativePath) {
    return null;
  }

  if (/^https?:\/\//.test(relativePath)) {
    return relativePath;
  }

  const normalized = String(relativePath).replace(/\\/g, "/");
  const uploadsIndex = normalized.lastIndexOf("/uploads/");

  if (uploadsIndex >= 0) {
    return `${API_ROOT}/${normalized.slice(uploadsIndex + 1)}`;
  }

  if (normalized.startsWith("uploads/")) {
    return `${API_ROOT}/${normalized}`;
  }

  return `${API_ROOT}/${normalized.replace(/^\/+/, "")}`;
}

export { API_BASE_URL, API_ROOT };
