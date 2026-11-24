import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { clinicLocalDateTimeToUtc, clinicLocalParts, isDateString, nextDate, timeToMinutes } from "../scheduling.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get("/doctors", async (_req, res) => {
  const result = await pool.query(
    `SELECT d.id, u.full_name AS "fullName", u.email, d.speciality,
       COALESCE((
         SELECT json_agg(json_build_object(
           'weekday', s.weekday,
           'startTime', to_char(s.start_time, 'HH24:MI'),
           'endTime', to_char(s.end_time, 'HH24:MI'),
           'slotMinutes', s.slot_minutes
         ) ORDER BY s.weekday)
         FROM doctor_schedules s WHERE s.doctor_id = d.id
       ), '[]'::json) AS schedules,
       COALESCE((
         SELECT json_agg(json_build_object('date', x.day_off::text, 'note', x.note) ORDER BY x.day_off)
         FROM doctor_days_off x WHERE x.doctor_id = d.id AND x.day_off >= CURRENT_DATE
       ), '[]'::json) AS "daysOff"
     FROM doctors d
     JOIN users u ON u.id = d.user_id
     ORDER BY u.full_name`
  );
  res.json(result.rows);
});

adminRouter.post("/doctors", async (req, res) => {
  const body = req.body ?? {};
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const speciality = typeof body.speciality === "string" ? body.speciality.trim() : "";

  if (!fullName || !email || !speciality || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Укажите имя, корректный email и специальность" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Пароль должен содержать не менее 8 символов" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'doctor') RETURNING id`,
      [email, passwordHash, fullName]
    );
    const doctorResult = await client.query(
      `INSERT INTO doctors (user_id, speciality)
       VALUES ($1, $2)
       RETURNING id, speciality`,
      [userResult.rows[0].id, speciality]
    );
    await client.query("COMMIT");
    res.status(201).json({
      id: doctorResult.rows[0].id,
      fullName,
      email,
      speciality: doctorResult.rows[0].speciality,
      schedules: [],
      daysOff: [],
    });
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    const code = typeof err === "object" && err !== null && "code" in err
      ? String(err.code)
      : undefined;
    if (code === "23505") {
      res.status(409).json({ error: "Пользователь с таким email уже существует" });
      return;
    }
    throw err;
  } finally {
    client.release();
  }
});

adminRouter.put("/doctors/:doctorId", async (req, res) => {
  const doctorId = Number(req.params.doctorId);
  const body = req.body ?? {};
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const speciality = typeof body.speciality === "string" ? body.speciality.trim() : "";
  if (!Number.isInteger(doctorId) || doctorId < 1 || !fullName || !speciality) {
    res.status(400).json({ error: "Укажите имя и специальность врача" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const doctor = await client.query("SELECT user_id FROM doctors WHERE id = $1", [doctorId]);
    if (doctor.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Врач не найден" });
      return;
    }
    await client.query("UPDATE users SET full_name = $1 WHERE id = $2", [fullName, doctor.rows[0].user_id]);
    await client.query("UPDATE doctors SET speciality = $1 WHERE id = $2", [speciality, doctorId]);
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

adminRouter.put("/doctors/:doctorId/schedule/:weekday", async (req, res) => {
  const doctorId = Number(req.params.doctorId);
  const weekday = Number(req.params.weekday);
  const body = req.body ?? {};
  const startTime = typeof body.startTime === "string" ? body.startTime : "";
  const endTime = typeof body.endTime === "string" ? body.endTime : "";

  if (!Number.isInteger(doctorId) || doctorId < 1 || !Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    res.status(400).json({ error: "Неверный врач или день недели" });
    return;
  }

  if (!startTime && !endTime) {
    const futureAppointments = await pool.query(
      "SELECT start_time AS \"startTime\" FROM appointments WHERE doctor_id = $1 AND start_time >= NOW()",
      [doctorId]
    );
    const hasAppointmentsOnWeekday = futureAppointments.rows.some(
      (appointment) => clinicLocalParts(new Date(appointment.startTime)).weekday === weekday
    );
    if (hasAppointmentsOnWeekday) {
      res.status(409).json({ error: "Нельзя убрать день с будущими записями. Сначала свяжитесь с пациентами." });
      return;
    }
    await pool.query("DELETE FROM doctor_schedules WHERE doctor_id = $1 AND weekday = $2", [doctorId, weekday]);
    res.json({ ok: true });
    return;
  }

  const slotMinutes = Number(body.slotMinutes);
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime) || ![15, 30, 45, 60].includes(slotMinutes)) {
    res.status(400).json({ error: "Проверьте часы работы и длительность приёма" });
    return;
  }
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  if (startHour > 23 || endHour > 23 || startMinute > 59 || endMinute > 59 || startHour * 60 + startMinute >= endHour * 60 + endMinute) {
    res.status(400).json({ error: "Время окончания должно быть позже времени начала" });
    return;
  }

  const futureAppointments = await pool.query(
    "SELECT start_time AS \"startTime\", duration_minutes AS \"durationMinutes\" FROM appointments WHERE doctor_id = $1 AND start_time >= NOW()",
    [doctorId]
  );
  const openMinute = startHour * 60 + startMinute;
  const closeMinute = endHour * 60 + endMinute;
  const invalidatesAppointment = futureAppointments.rows.some((appointment) => {
    const local = clinicLocalParts(new Date(appointment.startTime));
    if (local.weekday !== weekday) return false;
    const minute = timeToMinutes(local.time);
    return minute < openMinute || minute + Number(appointment.durationMinutes) > closeMinute || (minute - openMinute) % slotMinutes !== 0;
  });
  if (invalidatesAppointment) {
    res.status(409).json({ error: "Изменение затронет будущие записи. Сначала свяжитесь с пациентами." });
    return;
  }

  const doctor = await pool.query("SELECT id FROM doctors WHERE id = $1", [doctorId]);
  if (doctor.rowCount === 0) {
    res.status(404).json({ error: "Врач не найден" });
    return;
  }

  await pool.query(
    `INSERT INTO doctor_schedules (doctor_id, weekday, start_time, end_time, slot_minutes)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (doctor_id, weekday) DO UPDATE
       SET start_time = EXCLUDED.start_time,
           end_time = EXCLUDED.end_time,
           slot_minutes = EXCLUDED.slot_minutes`,
    [doctorId, weekday, startTime, endTime, slotMinutes]
  );
  res.json({ ok: true });
});

adminRouter.post("/doctors/:doctorId/days-off", async (req, res) => {
  const doctorId = Number(req.params.doctorId);
  const body = req.body ?? {};
  const date = body.date;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) : "";
  if (!Number.isInteger(doctorId) || doctorId < 1 || !isDateString(date)) {
    res.status(400).json({ error: "Укажите корректную дату" });
    return;
  }

  const dayStart = clinicLocalDateTimeToUtc(date, "00:00");
  const dayEnd = clinicLocalDateTimeToUtc(nextDate(date), "00:00");
  const existingAppointments = await pool.query(
    "SELECT 1 FROM appointments WHERE doctor_id = $1 AND start_time >= $2 AND start_time < $3 LIMIT 1",
    [doctorId, dayStart, dayEnd]
  );
  if (existingAppointments.rowCount) {
    res.status(409).json({ error: "На эту дату уже есть записи. Сначала свяжитесь с пациентами." });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO doctor_days_off (doctor_id, day_off, note)
       VALUES ($1, $2, $3)
       RETURNING day_off::text AS date, note`,
      [doctorId, date, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    const code = typeof err === "object" && err !== null && "code" in err
      ? String(err.code)
      : undefined;
    if (code === "23505") {
      res.status(409).json({ error: "Для этого дня выходной уже добавлен" });
      return;
    }
    if (code === "23503") {
      res.status(404).json({ error: "Врач не найден" });
      return;
    }
    throw err;
  }
});

adminRouter.delete("/doctors/:doctorId/days-off/:date", async (req, res) => {
  const doctorId = Number(req.params.doctorId);
  const date = req.params.date;
  if (!Number.isInteger(doctorId) || doctorId < 1 || !isDateString(date)) {
    res.status(400).json({ error: "Укажите корректную дату" });
    return;
  }
  await pool.query("DELETE FROM doctor_days_off WHERE doctor_id = $1 AND day_off = $2", [doctorId, date]);
  res.json({ ok: true });
});

adminRouter.get("/appointments", async (_req, res) => {
  const result = await pool.query(
    `SELECT a.id, a.start_time AS "startTime",
            p.full_name AS "patientName", p.email AS "patientEmail",
            duser.full_name AS "doctorName", d.speciality
     FROM appointments a
     JOIN users p ON p.id = a.patient_id
     JOIN doctors d ON d.id = a.doctor_id
     JOIN users duser ON duser.id = d.user_id
     WHERE a.start_time >= NOW()
     ORDER BY a.start_time
     LIMIT 300`
  );
  res.json(result.rows);
});
