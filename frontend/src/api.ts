export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const token = localStorage.getItem("token");

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Не удалось подключиться к серверу. Проверьте, что backend запущен.");
  }

  const responseText = await res.text();
  let data: { error?: string } | T;
  try {
    data = responseText ? JSON.parse(responseText) as { error?: string } | T : {};
  } catch {
    data = {};
  }

  if (!res.ok) {
    const serverMessage = typeof data === "object" && data !== null && "error" in data
      ? data.error
      : undefined;
    throw new Error(serverMessage || `Сервер вернул ошибку (${res.status}). Проверьте, что backend и база данных запущены.`);
  }

  if (!responseText || (typeof data === "object" && data !== null && Object.keys(data).length === 0)) {
    throw new Error("Сервер вернул пустой или некорректный ответ.");
  }

  return data as T;
}
