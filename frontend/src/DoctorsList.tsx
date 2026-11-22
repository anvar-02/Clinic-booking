import { useEffect, useState } from "react";
import { api } from "./api";

type Doctor = { id: number; fullName: string; speciality: string };

function DoctorCard({ doctor, onBooked }: { doctor: Doctor; onBooked: () => void }) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function book() {
    if (!time) {
      setIsError(true);
      setMessage("Выберите дату и время");
      return;
    }
    try {
      await api("/api/appointments", "POST", {
        doctorId: doctor.id,
        startTime: new Date(time).toISOString(),
      });
      setIsError(false);
      setMessage("Вы записаны!");
      setOpen(false);
      onBooked();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Ошибка");
    }
  }

  return (
    <div className="card">
      <h3>{doctor.fullName}</h3>
      <p>{doctor.speciality}</p>

      {open ? (
        <>
          <input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <button onClick={book}>Подтвердить</button>
          <button onClick={() => setOpen(false)}>Отмена</button>
        </>
      ) : (
        <button onClick={() => setOpen(true)}>Записаться</button>
      )}

      {message && <p style={{ color: isError ? "red" : "green" }}>{message}</p>}
    </div>
  );
}

export function DoctorsList({ onBooked }: { onBooked: () => void }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Doctor[]>("/api/doctors")
      .then(setDoctors)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h2>Врачи</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {doctors.map((d) => (
        <DoctorCard key={d.id} doctor={d} onBooked={onBooked} />
      ))}
    </div>
  );
}