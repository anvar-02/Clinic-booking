export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Ошибка запроса");
  }
  return data as T;
}