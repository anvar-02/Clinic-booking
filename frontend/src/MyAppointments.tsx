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

  useEffect(() => {
    api<Appointment[]>("/api/appointments/my")
      .then(setItems)
      .catch(() => setItems([]));
  }, [refreshKey]);

  return (
    <div>
      <h2>Мои записи</h2>
      {items.length === 0 && <p>Пока нет записей</p>}
      <ul>
        {items.map((a) => (
          <li key={a.id}>
            {new Date(a.startTime).toLocaleString("ru-RU", {
              dateStyle: "long",
              timeStyle: "short",
            })}{" "}
            — {a.doctorName} ({a.speciality})
          </li>
        ))}
      </ul>
    </div>
  );
}