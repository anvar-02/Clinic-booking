import { useEffect, useState } from "react";
import { api } from "./api";

type Appointment = {
  id: number;
  startTime: string;
  doctorName: string;
  speciality: string;
};

export function MyAppointments({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Appointment[]>("/api/appointments/my")
      .then(setItems)
      .catch(() => setItems([]));
  }, [refreshKey]);

  async function cancel(id: number) {
    if (!window.confirm("Отменить запись?")) return;
    setError("");
    try {
      await api(`/api/appointments/${id}`, "DELETE");
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  return (
    <div>
      <h2>Мои записи</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {items.length === 0 && <p>Пока нет записей</p>}
      <ul>
        {items.map((a) => (
          <li key={a.id}>
            {new Date(a.startTime).toLocaleString("ru-RU", {
              dateStyle: "long",
              timeStyle: "short",
            })}{" "}
            — {a.doctorName} ({a.speciality}){" "}
            <button onClick={() => cancel(a.id)}>Отменить</button>
          </li>
        ))}
      </ul>
    </div>
  );
}