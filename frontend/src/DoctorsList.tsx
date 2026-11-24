import { useEffect, useState } from "react";
import { api } from "./api";

type Doctor = { id: number; fullName: string; speciality: string };
type Slot = { startTime: string; localTime: string };

function localDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DoctorCard({ doctor, onBooked }: { doctor: Doctor; onBooked: () => void }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(localDateInputValue);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!open || !date) return;
    let active = true;
    setLoadingSlots(true);
    setSelectedStartTime("");
    setMessage("");
    api<Slot[]>(`/api/doctors/${doctor.id}/slots?date=${encodeURIComponent(date)}`)
      .then((availableSlots) => {
        if (active) setSlots(availableSlots);
      })
      .catch((err: unknown) => {
        if (active) {
          setSlots([]);
          setIsError(true);
          setMessage(err instanceof Error ? err.message : "Не удалось загрузить расписание");
        }
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => { active = false; };
  }, [date, doctor.id, open]);

  async function book() {
    if (!selectedStartTime) {
      setIsError(true);
      setMessage("Выберите свободное время");
      return;
    }
    try {
      await api("/api/appointments", "POST", {
        doctorId: doctor.id,
        startTime: selectedStartTime,
      });
      setIsError(false);
      setMessage("Вы записаны на приём!");
      setOpen(false);
      onBooked();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Не удалось создать запись");
    }
  }

  return (
    <article className="card doctor-booking-card">
      <div>
        <h3>{doctor.fullName}</h3>
        <p>{doctor.speciality}</p>
      </div>

      {open ? (
        <div className="slot-picker">
          <label>
            Дата приёма
            <input type="date" min={localDateInputValue()} value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label>
            Свободное время
            <select value={selectedStartTime} onChange={(event) => setSelectedStartTime(event.target.value)} disabled={loadingSlots || slots.length === 0}>
              <option value="">{loadingSlots ? "Загружаем время…" : slots.length ? "Выберите время" : "Нет свободных слотов"}</option>
              {slots.map((slot) => <option key={slot.startTime} value={slot.startTime}>{slot.localTime}</option>)}
            </select>
          </label>
          {slots.length === 0 && !loadingSlots && !message && <p className="slot-hint">Выберите другой день или обратитесь в клинику.</p>}
          <div className="slot-actions">
            <button onClick={book} disabled={loadingSlots || slots.length === 0}>Подтвердить запись</button>
            <button className="button-quiet" onClick={() => setOpen(false)}>Отмена</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)}>Выбрать время</button>
      )}

      {message && <p className={isError ? "form-message is-error" : "form-message is-success"} role="status">{message}</p>}
    </article>
  );
}

export function DoctorsList({ onBooked }: { onBooked: () => void }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Doctor[]>("/api/doctors")
      .then(setDoctors)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Не удалось загрузить список врачей"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="doctors-list">
      <h2>Врачи</h2>
      {loading && <p>Загружаем список врачей…</p>}
      {error && <p className="form-message is-error" role="alert">{error}</p>}
      {!loading && !error && doctors.length === 0 && <p>Список врачей пока пуст.</p>}
      {doctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} onBooked={onBooked} />)}
    </div>
  );
}
