import { useEffect, useState } from "react";
import { api } from "./api";

type Visit = { id: number; startTime: string; patientName: string };

export function DoctorSchedule() {
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    api<Visit[]>("/api/appointments/doctor")
      .then(setVisits)
      .catch(() => setVisits([]));
  }, []);

  return (
    <div>
      <h2>Мои приёмы</h2>
      {visits.length === 0 && <p>Пока нет записей</p>}
      <ul>
        {visits.map((v) => (
          <li key={v.id}>
            {new Date(v.startTime).toLocaleString("ru-RU", {
              dateStyle: "long",
              timeStyle: "short",
            })}{" "}
            — {v.patientName}
          </li>
        ))}
      </ul>
    </div>
  );
}