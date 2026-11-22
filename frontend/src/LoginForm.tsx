import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "./api";

type Props = { onLogin: () => void };

export function LoginForm({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await api<{ token: string }>("/api/auth/login", "POST", { email, password });
      localStorage.setItem("token", data.token);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Вход</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Войти</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}