import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  clinicLocalDateTimeToUtc,
  clinicLocalParts,
  isDateString,
  minutesToTime,
  nextDate,
  timeToMinutes,
  weekdayForDate,
} from "../scheduling.js";

export const doctorsRouter = Router();

doctorsRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query(
    `SELECT d.id, u.full_name AS "fullName", d.speciality
     FROM doctors d
     JOIN users u ON u.id = d.user_id
     ORDER BY u.full_name`
  );
  res.json(result.rows);
});

doctorsRouter.get("/:id/slots", requireAuth, requireRole("patient"), async (req, res) => {
  const doctorId = Number(req.params.id);
  const date = req.query.date;
  if (!Number.isInteger(doctorId) || doctorId < 1 || !isDateString(date)) {
    res.status(400).json({ error: "Укажите врача и корректную дату" });
    return;
  }

  const doctor = await pool.query("SELECT id FROM doctors WHERE id = $1", [doctorId]);
  if (doctor.rowCount === 0) {
    res.status(404).json({ error: "Врач не найден" });
    return;
  }

  const dayOff = await pool.query(
    "SELECT 1 FROM doctor_days_off WHERE doctor_id = $1 AND day_off = $2",
    [doctorId, date]
  );
  if (dayOff.rowCount) {
    res.json([]);
    return;
  }

  const scheduleResult = await pool.query(
    `SELECT to_char(start_time, 'HH24:MI') AS "startTime",
            to_char(end_time, 'HH24:MI') AS "endTime",
            slot_minutes AS "slotMinutes"
     FROM doctor_schedules
     WHERE doctor_id = $1 AND weekday = $2`,
    [doctorId, weekdayForDate(date)]
  );
  const schedule = scheduleResult.rows[0];
  if (!schedule || date < clinicLocalParts(new Date()).date) {
    res.json([]);
    return;
  }

  const dayStart = clinicLocalDateTimeToUtc(date, "00:00");
  const dayEnd = clinicLocalDateTimeToUtc(nextDate(date), "00:00");
  const bookedResult = await pool.query(
    `SELECT start_time AS "startTime", duration_minutes AS "durationMinutes"
     FROM appointments
     WHERE doctor_id = $1 AND start_time >= $2 AND start_time < $3`,
    [doctorId, dayStart, dayEnd]
  );
  const booked = bookedResult.rows.map((row) => ({
    start: new Date(row.startTime).getTime(),
    duration: Number(row.durationMinutes),
  }));
  const startMinute = timeToMinutes(schedule.startTime);
  const endMinute = timeToMinutes(schedule.endTime);
  const slots: Array<{ startTime: string; localTime: string }> = [];

  for (let minute = startMinute; minute + schedule.slotMinutes <= endMinute; minute += schedule.slotMinutes) {
    const localTime = minutesToTime(minute);
    const startTime = clinicLocalDateTimeToUtc(date, localTime);
    const start = startTime.getTime();
    const end = start + Number(schedule.slotMinutes) * 60_000;
    const overlapsBookedAppointment = booked.some((appointment) =>
      appointment.start < end && appointment.start + appointment.duration * 60_000 > start
    );
    if (startTime <= new Date() || overlapsBookedAppointment) continue;
    slots.push({ startTime: startTime.toISOString(), localTime });
  }

  res.json(slots);
});
