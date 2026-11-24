import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { clinicLocalParts, timeToMinutes } from "../scheduling.js";

export const appointmentsRouter = Router();

appointmentsRouter.post("/", requireAuth, requireRole("patient"), async (req, res) => {
  const doctorId = Number(req.body.doctorId);
  const { startTime } = req.body;

  if (!Number.isInteger(doctorId) || doctorId < 1 || typeof startTime !== "string") {
    res.status(400).json({ error: "Укажите врача и время приёма" });
    return;
  }

  const date = new Date(startTime);
  if (Number.isNaN(date.getTime()) || date.getUTCSeconds() !== 0 || date.getUTCMilliseconds() !== 0) {
    res.status(400).json({ error: "Неверный формат времени" });
    return;
  }
  if (date <= new Date()) {
    res.status(400).json({ error: "Нельзя записаться на прошедшее время" });
    return;
  }

  const doctor = await pool.query("SELECT id FROM doctors WHERE id = $1", [doctorId]);
  if (doctor.rowCount === 0) {
    res.status(404).json({ error: "Врач не найден" });
    return;
  }

  const local = clinicLocalParts(date);
  const scheduleResult = await pool.query(
    `SELECT to_char(start_time, 'HH24:MI') AS "startTime",
            to_char(end_time, 'HH24:MI') AS "endTime",
            slot_minutes AS "slotMinutes"
     FROM doctor_schedules
     WHERE doctor_id = $1 AND weekday = $2`,
    [doctorId, local.weekday]
  );
  const schedule = scheduleResult.rows[0];
  if (!schedule) {
    res.status(409).json({ error: "Для этого врача ещё не настроено расписание" });
    return;
  }

  const dayOff = await pool.query(
    "SELECT 1 FROM doctor_days_off WHERE doctor_id = $1 AND day_off = $2",
    [doctorId, local.date]
  );
  if (dayOff.rowCount) {
    res.status(409).json({ error: "В этот день врач не принимает" });
    return;
  }

  const selectedMinute = timeToMinutes(local.time);
  const openMinute = timeToMinutes(schedule.startTime);
  const closeMinute = timeToMinutes(schedule.endTime);
  if (
    selectedMinute < openMinute ||
    selectedMinute + schedule.slotMinutes > closeMinute ||
    (selectedMinute - openMinute) % schedule.slotMinutes !== 0
  ) {
    res.status(409).json({ error: "Выбранное время больше недоступно" });
    return;
  }

  try {
    const result = await pool.query(
    `INSERT INTO appointments (doctor_id, patient_id, start_time, duration_minutes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, doctor_id AS "doctorId", start_time AS "startTime"`,
      [doctorId, res.locals.user.userId, date, schedule.slotMinutes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    const code = typeof err === "object" && err !== null && "code" in err
      ? String(err.code)
      : undefined;
    if (code === "23505") {
      res.status(409).json({ error: "Это время уже занято" });
      return;
    }
    if (code === "23503") {
      res.status(404).json({ error: "Врач не найден" });
      return;
    }
    throw err;
  }
});

appointmentsRouter.get("/my", requireAuth, requireRole("patient"), async (req, res) => {
  const result = await pool.query(
    `SELECT a.id, a.start_time AS "startTime", u.full_name AS "doctorName", d.speciality
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     JOIN users u ON u.id = d.user_id
     WHERE a.patient_id = $1
     ORDER BY a.start_time`,
    [res.locals.user.userId]
  );
  res.json(result.rows);
});

appointmentsRouter.delete("/:id", requireAuth, requireRole("patient"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Неверный номер записи" });
    return;
  }

  const result = await pool.query(
    "DELETE FROM appointments WHERE id = $1 AND patient_id = $2",
    [id, res.locals.user.userId]
  );

  if (result.rowCount === 0) {
    res.status(404).json({ error: "Запись не найдена" });
    return;
  }

  res.json({ ok: true });
});

appointmentsRouter.get("/doctor", requireAuth, requireRole("doctor"), async (req, res) => {
  const result = await pool.query(
    `SELECT a.id, a.start_time AS "startTime", p.full_name AS "patientName"
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     JOIN users p ON p.id = a.patient_id
     WHERE d.user_id = $1
     ORDER BY a.start_time`,
    [res.locals.user.userId]
  );
  res.json(result.rows);
});
