import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "./api";

type Props = { onRegistered: () => void };

export function RegisterForm({ onRegistered }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

    async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/auth/register", "POST", { fullName, email, password });
      const data = await api<{ token: string }>("/api/auth/login", "POST", { email, password });
      localStorage.setItem("token", data.token);
      onRegistered();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Регистрация</h2>
      <input
        type="text"
        placeholder="Имя и фамилия"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Пароль (минимум 8 символов)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Зарегистрироваться</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}