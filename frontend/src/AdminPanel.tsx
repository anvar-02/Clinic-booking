import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "./api";

type Schedule = { weekday: number; startTime: string; endTime: string; slotMinutes: number };
type DayOff = { date: string; note: string };
type Doctor = {
  id: number;
  fullName: string;
  email: string;
  speciality: string;
  schedules: Schedule[];
  daysOff: DayOff[];
};
type Appointment = {
  id: number;
  startTime: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  speciality: string;
};

const weekdays = [
  { value: 1, label: "Понедельник" },
  { value: 2, label: "Вторник" },
  { value: 3, label: "Среда" },
  { value: 4, label: "Четверг" },
  { value: 5, label: "Пятница" },
  { value: 6, label: "Суббота" },
  { value: 0, label: "Воскресенье" },
];

function displayDate(value: string) {
  return new Date(value).toLocaleString("ru-RU", { dateStyle: "long", timeStyle: "short" });
}

function DoctorManagementCard({ doctor, onChanged }: { doctor: Doctor; onChanged: () => void }) {
  const [schedules, setSchedules] = useState<Schedule[]>(doctor.schedules);
  const [fullName, setFullName] = useState(doctor.fullName);
  const [speciality, setSpeciality] = useState(doctor.speciality);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileMessageIsError, setProfileMessageIsError] = useState(false);
  const [dayOffDate, setDayOffDate] = useState("");
  const [dayOffNote, setDayOffNote] = useState("");
  const [savingWeekday, setSavingWeekday] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setSchedules(doctor.schedules);
    setFullName(doctor.fullName);
    setSpeciality(doctor.speciality);
  }, [doctor]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    try {
      await api(`/api/admin/doctors/${doctor.id}`, "PUT", { fullName, speciality });
      setProfileMessageIsError(false);
      setProfileMessage("Данные врача сохранены.");
      onChanged();
    } catch (err) {
      setProfileMessageIsError(true);
      setProfileMessage(err instanceof Error ? err.message : "Не удалось сохранить данные врача");
    } finally {
      setSavingProfile(false);
    }
  }

  function rowFor(weekday: number) {
    return schedules.find((schedule) => schedule.weekday === weekday) ?? {
      weekday,
      startTime: "",
      endTime: "",
      slotMinutes: 30,
    };
  }

  function updateSchedule(weekday: number, changes: Partial<Schedule>) {
    setSchedules((current) => {
      const existing = current.find((schedule) => schedule.weekday === weekday);
      if (!existing) return [...current, { ...rowFor(weekday), ...changes }];
      return current.map((schedule) => schedule.weekday === weekday ? { ...schedule, ...changes } : schedule);
    });
  }

  async function saveSchedule(weekday: number) {
    const schedule = rowFor(weekday);
    setSavingWeekday(weekday);
    setMessage("");
    try {
      await api(`/api/admin/doctors/${doctor.id}/schedule/${weekday}`, "PUT", {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        slotMinutes: schedule.slotMinutes,
      });
      setIsError(false);
      setMessage("Расписание сохранено.");
      onChanged();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Не удалось сохранить расписание");
    } finally {
      setSavingWeekday(null);
    }
  }

  async function addDayOff(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await api(`/api/admin/doctors/${doctor.id}/days-off`, "POST", { date: dayOffDate, note: dayOffNote });
      setDayOffDate("");
      setDayOffNote("");
      setIsError(false);
      setMessage("Выходной добавлен.");
      onChanged();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Не удалось добавить выходной");
    }
  }

  async function removeDayOff(date: string) {
    try {
      await api(`/api/admin/doctors/${doctor.id}/days-off/${date}`, "DELETE");
      setIsError(false);
      setMessage("Выходной удалён.");
      onChanged();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Не удалось удалить выходной");
    }
  }

  return (
    <article className="admin-doctor-card">
      <div className="admin-doctor-heading"><div><h3>{doctor.fullName}</h3><p>{doctor.email}</p></div></div>

      <form className="admin-profile-form" onSubmit={saveProfile}>
        <label>Имя врача<input value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label>
        <label>Специальность<input value={speciality} onChange={(event) => setSpeciality(event.target.value)} required /></label>
        <button type="submit" disabled={savingProfile}>{savingProfile ? "Сохраняю…" : "Сохранить данные"}</button>
      </form>
      {profileMessage && <p className={profileMessageIsError ? "form-message is-error" : "form-message is-success"} role="status">{profileMessage}</p>}

      <h4>Еженедельное расписание</h4>
      <p className="admin-help">Оставь оба поля времени пустыми, чтобы отметить день выходным.</p>
      <div className="schedule-editor">
        {weekdays.map(({ value, label }) => {
          const schedule = rowFor(value);
          return (
            <div className="schedule-row" key={value}>
              <strong>{label}</strong>
              <label>С<input type="time" value={schedule.startTime} onChange={(event) => updateSchedule(value, { startTime: event.target.value })} /></label>
              <label>До<input type="time" value={schedule.endTime} onChange={(event) => updateSchedule(value, { endTime: event.target.value })} /></label>
              <label>Приём, мин<select value={schedule.slotMinutes} onChange={(event) => updateSchedule(value, { slotMinutes: Number(event.target.value) })}><option value={15}>15</option><option value={30}>30</option><option value={45}>45</option><option value={60}>60</option></select></label>
              <button className="schedule-save" onClick={() => saveSchedule(value)} disabled={savingWeekday === value}>{savingWeekday === value ? "Сохраняю…" : "Сохранить"}</button>
            </div>
          );
        })}
      </div>

      <div className="day-off-section">
        <h4>Выходные даты</h4>
        <form className="day-off-form" onSubmit={addDayOff}>
          <label>Дата<input type="date" min={new Date().toLocaleDateString("en-CA")} value={dayOffDate} onChange={(event) => setDayOffDate(event.target.value)} required /></label>
          <label>Комментарий<input type="text" maxLength={200} placeholder="Например, отпуск" value={dayOffNote} onChange={(event) => setDayOffNote(event.target.value)} /></label>
          <button type="submit">Добавить выходной</button>
        </form>
        {doctor.daysOff.length > 0 ? (
          <ul className="day-off-list">
            {doctor.daysOff.map((dayOff) => <li key={dayOff.date}><span>{new Date(`${dayOff.date}T12:00:00`).toLocaleDateString("ru-RU", { dateStyle: "long" })}{dayOff.note ? ` · ${dayOff.note}` : ""}</span><button onClick={() => removeDayOff(dayOff.date)}>Удалить</button></li>)}
          </ul>
        ) : <p className="admin-help">Особые выходные не добавлены.</p>}
      </div>
      {message && <p className={isError ? "form-message is-error" : "form-message is-success"} role="status">{message}</p>}
    </article>
  );
}

export function AdminPanel() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctorForm, setDoctorForm] = useState({ fullName: "", email: "", password: "", speciality: "" });
  const [savingDoctor, setSavingDoctor] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      api<Doctor[]>("/api/admin/doctors"),
      api<Appointment[]>("/api/admin/appointments"),
    ])
      .then(([doctorRows, appointmentRows]) => {
        if (!active) return;
        setDoctors(doctorRows);
        setAppointments(appointmentRows);
        setError("");
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Не удалось загрузить данные панели");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  async function addDoctor(event: FormEvent) {
    event.preventDefault();
    setSavingDoctor(true);
    setMessage("");
    try {
      await api<Doctor>("/api/admin/doctors", "POST", doctorForm);
      setDoctorForm({ fullName: "", email: "", password: "", speciality: "" });
      setMessage("Врач добавлен. Теперь настройте его расписание.");
      setMessageIsError(false);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Не удалось добавить врача");
      setMessageIsError(true);
    } finally {
      setSavingDoctor(false);
    }
  }

  return (
    <div className="admin-panel">
      <section className="cabinet-panel admin-create-panel">
        <h2>Добавить врача</h2>
        <p>Будет создан аккаунт врача. Передай врачу email и пароль для входа.</p>
        <form className="admin-doctor-form" onSubmit={addDoctor}>
          <label>Имя и фамилия<input value={doctorForm.fullName} onChange={(event) => setDoctorForm({ ...doctorForm, fullName: event.target.value })} required /></label>
          <label>Специальность<input value={doctorForm.speciality} onChange={(event) => setDoctorForm({ ...doctorForm, speciality: event.target.value })} required /></label>
          <label>Email<input type="email" value={doctorForm.email} onChange={(event) => setDoctorForm({ ...doctorForm, email: event.target.value })} required /></label>
          <label>Пароль для входа<input type="password" minLength={8} value={doctorForm.password} onChange={(event) => setDoctorForm({ ...doctorForm, password: event.target.value })} required /></label>
          <button type="submit" disabled={savingDoctor}>{savingDoctor ? "Добавляю…" : "Добавить врача"}</button>
        </form>
        {message && <p className={messageIsError ? "form-message is-error" : "form-message is-success"} role="status">{message}</p>}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading"><h2>Врачи и расписание</h2><button className="admin-refresh" onClick={() => setReloadKey((key) => key + 1)}>Обновить</button></div>
        {loading && <p>Загружаем данные…</p>}
        {error && <p className="form-message is-error" role="alert">{error}</p>}
        {!loading && !error && doctors.length === 0 && <p>Врачей пока нет. Добавь первого врача выше.</p>}
        {!error && doctors.map((doctor) => <DoctorManagementCard key={doctor.id} doctor={doctor} onChanged={() => setReloadKey((key) => key + 1)} />)}
      </section>

      <section className="admin-section">
        <h2>Предстоящие записи</h2>
        {appointments.length === 0 && !loading ? <p>Предстоящих записей пока нет.</p> : (
          <ul className="admin-appointment-list">
            {appointments.map((appointment) => <li key={appointment.id}><div><strong>{displayDate(appointment.startTime)}</strong><span>{appointment.doctorName} · {appointment.speciality}</span></div><div><strong>{appointment.patientName}</strong><span>{appointment.patientEmail}</span></div></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
